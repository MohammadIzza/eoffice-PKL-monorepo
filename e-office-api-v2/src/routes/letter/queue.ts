// Endpoint: Get approval queue (berdasarkan role user)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { STEP_TO_ROLE } from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async ({ user, query }) => {
			const { activeRole } = query;

			if (!activeRole) {
				throw new Error("Header X-Active-Role atau query activeRole diperlukan");
			}

			// 1. Cari step mana yang sesuai dengan role ini
			const stepNumber = Object.keys(STEP_TO_ROLE).find(
				(step) =>
					STEP_TO_ROLE[Number(step) as keyof typeof STEP_TO_ROLE] ===
					activeRole,
			);

			if (!stepNumber) {
				// Role ini bukan approver workflow
				return {
					success: true,
					data: [],
					message: `Role ${activeRole} tidak memiliki queue approval`,
				};
			}

			// 2. Query letters yang currentStep = stepNumber DAN user adalah assignee
			const allLettersAtThisStep = await Prisma.letterInstance.findMany({
				where: {
					currentStep: Number(stepNumber),
					status: "PROCESSING",
				},
				include: {
					letterType: true,
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							mahasiswa: true,
						},
					},
				},
				orderBy: {
					createdAt: "asc",  // FIFO
				},
			});

			// 3. Filter: hanya yang user ini adalah assignee
			// Map role ke key di assignedApprovers
			const roleToKey: Record<string, string> = {
				dosen_pembimbing: "dospem",
				dosen_koordinator: "koordinator",
				ketua_program_studi: "kaprodi",
				admin_fakultas: "adminFakultas",
				supervisor_akademik: "supervisor",
				manajer_tu: "manajerTu",
				wakil_dekan_1: "wakilDekan1",
				upa: "upa",
			};

			const assigneeKey = roleToKey[activeRole];
			if (!assigneeKey) {
				return { success: true, data: [] };
			}

			const myQueue = allLettersAtThisStep.filter((letter) => {
				const assignedApprovers = letter.assignedApprovers as Record<
					string,
					string
				>;
				return assignedApprovers[assigneeKey] === user.id;
			});

			return {
				success: true,
				data: myQueue,
				meta: {
					total: myQueue.length,
					step: Number(stepNumber),
					role: activeRole,
				},
			};
		},
		{
			query: t.Object({
				activeRole: t.String(),
			}),
		},
	);
