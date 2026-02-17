import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { 
    STEP_TO_ROLE, 
    getAssigneeForStep 
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

const ROLE_TO_KEY: Record<string, string> = {
	dosen_pembimbing: "dospem",
	dosen_koordinator: "koordinator",
	ketua_program_studi: "kaprodi",
	admin_fakultas: "adminFakultas",
	supervisor_akademik: "supervisor",
	manajer_tu: "manajerTu",
	wakil_dekan_1: "wakilDekan1",
	upa: "upa",
};

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async ({ user, query }) => {
			const { activeRole, includeApproved } = query;

			if (!activeRole) {
				throw new Error("Header X-Active-Role atau query activeRole diperlukan");
			}

			const stepNum = Object.keys(STEP_TO_ROLE).find(
				(k) =>
					STEP_TO_ROLE[Number(k) as keyof typeof STEP_TO_ROLE] === activeRole,
			);
			if (!stepNum) {
				return {
					success: true,
					data: [],
					message: `Role ${activeRole} tidak memiliki queue approval`,
				};
			}

			const stepNumber = Number(stepNum);

            // Added back for code style consistency, though logic uses getAssigneeForStep for robustness
			const assigneeKey = ROLE_TO_KEY[activeRole];

			const allAtStep = await Prisma.letterInstance.findMany({
				where: {
					currentStep: stepNumber,
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
				orderBy: { createdAt: "asc" },
			});

			const myQueue = allAtStep.filter((letter) => {
				const assigned = letter.assignedApprovers as Record<string, string>;
                
                // Prioritaskan logic robust (getAssigneeForStep)
                let assigneeId = getAssigneeForStep(assigned, stepNumber);

                // Fallback ke logic lama jika robust belum mencakup (meskipun getAssigneeForStep sudah cover semua)
                if (!assigneeId && assigneeKey && assigned[assigneeKey]) {
                    assigneeId = assigned[assigneeKey];
                }

				return assigneeId === user.id;
			});

			const pending = myQueue.map((letter) => ({
				...letter,
				approvalStatus: "pending" as const,
				approvedAt: null as null,
			}));

			if (!includeApproved) {
				return {
					success: true,
					data: pending,
					meta: {
						total: pending.length,
						step: stepNumber,
						role: activeRole,
						totalPending: pending.length,
						totalApproved: 0,
					},
				};
			}

			const pendingIds = new Set(pending.map((l) => l.id));
			const approvedHistory = await Prisma.letterStepHistory.findMany({
				where: {
					action: { in: ["APPROVED", "REJECTED", "NUMBERED"] },
					actorUserId: user.id,
					step: stepNumber,
				},
				include: {
					letter: {
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
					},
				},
				orderBy: { createdAt: "desc" },
			});

			// Filter approval yang masih valid (tidak ada revisi/resubmit setelahnya)
			const seen = new Set<string>();
			const approved: Array<{
				[key: string]: unknown;
				approvalStatus: "approved_by_me" | "rejected_by_me";
				approvedAt: Date;
			}> = [];
			
			for (const h of approvedHistory) {
				const letter = h.letter;
				if (!letter || pendingIds.has(letter.id) || seen.has(letter.id)) continue;
				
				// Cek apakah ada revisi/resubmit setelah approval ini
				const laterRevision = await Prisma.letterStepHistory.findFirst({
					where: {
						letterId: letter.id,
						action: { in: ["REVISED", "SELF_REVISED", "RESUBMITTED"] },
						createdAt: { gt: h.createdAt },
					},
				});
				
				// Hanya tambahkan jika approval masih valid (tidak ada revisi setelahnya)
				if (!laterRevision) {
					seen.add(letter.id);
					const status = h.action === "REJECTED" ? "rejected_by_me" : "approved_by_me";
					approved.push({
						...letter,
						approvalStatus: status,
						approvedAt: h.createdAt,
					});
				}
			}

			const combined = [...pending, ...approved];

			return {
				success: true,
				data: combined,
				meta: {
					total: combined.length,
					step: stepNumber,
					role: activeRole,
					totalPending: pending.length,
					totalApproved: approved.length,
				},
			};
		},
		{
			query: t.Object({
				activeRole: t.String(),
				includeApproved: t.Optional(t.Boolean()),
			}),
		},
	);
