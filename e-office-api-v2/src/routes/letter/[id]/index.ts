import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async ({ params: { id }, user }) => {
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
				include: {
					letterType: true,
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					stepHistory: {
						include: {
							actor: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
						orderBy: {
							createdAt: "asc",
						},
					},
					attachments: {
						where: {
							isActive: true,
						},
					},
					numbering: true,
				},
			});

		if (!letter) {
			throw new Error("Surat tidak ditemukan");
		}

		// Authorization check: hanya creator, assignee, atau user yang pernah approve/reject/revise
		const isCreator = letter.createdById === user.id;
		
		const hasApproved = await Prisma.letterStepHistory.findFirst({
			where: {
				letterId: letter.id,
				actorUserId: user.id,
				action: { in: ["APPROVED", "REJECTED", "REVISED"] },
			},
		});

		if (!isCreator && !hasApproved) {
			const assignedApprovers = letter.assignedApprovers as Record<string, string> | null;
			const isAssignee = assignedApprovers
				? Object.values(assignedApprovers).includes(user.id)
				: false;

			if (!isAssignee) {
				throw new Error("Anda tidak berhak melihat surat ini");
			}
		}

		return {
			success: true,
			data: letter,
		};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
