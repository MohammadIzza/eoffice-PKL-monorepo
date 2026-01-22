// Endpoint: Revise surat (rollback 1 step)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import {
	validateUserIsAssignee,
	calculateRollbackStep,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { comment } = body;

			if (!comment || comment.trim().length < 10) {
				throw new Error(
					"Komentar wajib diisi minimal 10 karakter untuk revisi",
				);
			}

			// 1. Get letter
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

			const currentStep = letter.currentStep!;

			// 2. Validate user adalah assignee
			validateUserIsAssignee(letter, user.id, currentStep);

			// 3. Calculate rollback target (mundur 1 step dari current pending)
			const rollbackToStep = calculateRollbackStep(currentStep);

			// 4. Get user role
			const userRoles = await Prisma.userRole.findFirst({
				where: { userId: user.id },
				include: { role: true },
			});
			const actorRole = userRoles?.role.name || "unknown";

			// 5. Update letter: rollback currentStep
			await Prisma.letterInstance.update({
				where: { id },
				data: {
					currentStep: rollbackToStep,
				},
			});

			// 6. Record REVISED action
			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "REVISED",
					step: currentStep,
					actorUserId: user.id,
					actorRole: actorRole,
					comment: comment,
					fromStep: currentStep,
					toStep: rollbackToStep,
				},
			});

			return {
				success: true,
				message: "Surat dikembalikan untuk revisi",
				data: {
					letterId: letter.id,
					currentStep: rollbackToStep,
					message: `Surat dikembalikan ke step ${rollbackToStep}. Step yang terdampak perlu approve ulang.`,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				comment: t.String({ minLength: 10 }),
			}),
		},
	);
