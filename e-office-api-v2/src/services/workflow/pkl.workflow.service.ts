import { Prisma } from "@backend/db/index.ts";
import type { LetterInstance, LetterStepHistory } from "@backend/db/index.ts";

export const PKL_WORKFLOW_STEPS = {
	DOSEN_PEMBIMBING: 1,
	DOSEN_KOORDINATOR: 2,
	KETUA_PROGRAM_STUDI: 3,
	ADMIN_FAKULTAS: 4,
	SUPERVISOR_AKADEMIK: 5,
	MANAJER_TU: 6,
	WAKIL_DEKAN_1: 7,
	UPA: 8,
} as const;

export const STEP_TO_ROLE = {
	1: "dosen_pembimbing",
	2: "dosen_koordinator",
	3: "ketua_program_studi",
	4: "admin_fakultas",
	5: "supervisor_akademik",
	6: "manajer_tu",
	7: "wakil_dekan_1",
	8: "upa",
} as const;

export async function determineApproversForPKL(
	prodiId: string,
	selectedDosenPembimbingUserId: string,
): Promise<Record<string, string>> {
	// 1. Get dosen pembimbing (dari pilihan mahasiswa)
	const dospem = await Prisma.user.findUnique({
		where: { id: selectedDosenPembimbingUserId },
		include: {
			userRole: {
				include: { role: true },
			},
		},
	});

	if (
		!dospem ||
		!dospem.userRole.some((ur) => ur.role.name === "dosen_pembimbing")
	) {
		throw new Error("Dosen pembimbing yang dipilih tidak valid");
	}

	const prodiStaff = await Prisma.pegawai.findMany({
		where: {
			programStudiId: prodiId,
		},
		include: {
			user: {
				include: {
					userRole: {
						include: { role: true },
					},
				},
			},
		},
	});

	const koordinator = prodiStaff.find((p) =>
		p.user.userRole.some((ur) => ur.role.name === "dosen_koordinator"),
	);
	const kaprodi = prodiStaff.find((p) =>
		p.user.userRole.some((ur) => ur.role.name === "ketua_program_studi"),
	);

	if (!koordinator) {
		throw new Error(
			"Koordinator PKL belum ditentukan untuk prodi ini. Hubungi admin.",
		);
	}
	if (!kaprodi) {
		throw new Error(
			"Ketua Program Studi belum ditentukan untuk prodi ini. Hubungi admin.",
		);
	}

	const fixRoles = [
		"admin_fakultas",
		"supervisor_akademik",
		"manajer_tu",
		"wakil_dekan_1",
		"upa",
	];

	const fixApprovers: Record<string, string> = {};
	for (const roleName of fixRoles) {
		const userWithRole = await Prisma.userRole.findFirst({
			where: {
				role: { name: roleName },
			},
			include: { user: true },
		});

		if (!userWithRole) {
			throw new Error(
				`Role ${roleName} belum ada user. Hubungi superadmin.`,
			);
		}

		fixApprovers[roleName] = userWithRole.userId;
	}

	const assignedApprovers: Record<string, string> = {
		dospem: dospem.id,
		koordinator: koordinator.user.id,
		kaprodi: kaprodi.user.id,
		adminFakultas: fixApprovers.admin_fakultas!,  // Non-null karena sudah validated
		supervisor: fixApprovers.supervisor_akademik!,
		manajerTu: fixApprovers.manajer_tu!,
		wakilDekan1: fixApprovers.wakil_dekan_1!,
		upa: fixApprovers.upa!,
	};

	return assignedApprovers;
}

export async function validateOnlyOneActiveLetter(
	mahasiswaUserId: string,
): Promise<void> {
	const activeLetter = await Prisma.letterInstance.findFirst({
		where: {
			createdById: mahasiswaUserId,
			status: {
				notIn: ["COMPLETED", "REJECTED", "CANCELLED"],
			},
		},
	});

	if (activeLetter) {
		throw new Error(
			"Anda masih memiliki surat PKL yang sedang diproses. Selesaikan atau batalkan surat sebelumnya terlebih dahulu.",
		);
	}
}

export function getAssigneeForStep(
	assignedApprovers: Record<string, string>,
	step: number,
): string | null {
	const roleKey = STEP_TO_ROLE[step as keyof typeof STEP_TO_ROLE];
	if (!roleKey) return null;

	const keyMap: Record<string, string> = {
		dosen_pembimbing: "dospem",
		dosen_koordinator: "koordinator",
		ketua_program_studi: "kaprodi",
		admin_fakultas: "adminFakultas",
		supervisor_akademik: "supervisor",
		manajer_tu: "manajerTu",
		wakil_dekan_1: "wakilDekan1",
		upa: "upa",
	};

	const key = keyMap[roleKey];
	if (!key) return null;
	return assignedApprovers[key] || null;
}

export function validateUserIsAssignee(
	letter: LetterInstance,
	userId: string,
	step: number,
): void {
	const assignedApprovers = letter.assignedApprovers as Record<string, string>;
	const assignee = getAssigneeForStep(assignedApprovers, step);

	if (assignee !== userId) {
		throw new Error("Anda bukan penanggung jawab untuk step ini");
	}
}

export function calculateRollbackStep(currentStep: number): number {
	return Math.max(1, currentStep - 1);
}
