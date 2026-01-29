import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { calculateRollbackStep } from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			if (letter.createdById !== user.id) {
				throw new Error("Anda tidak berhak merevisi surat ini");
			}

			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

			if (letter.signedAt) {
				throw new Error(
					"Surat tidak dapat direvisi karena sudah ditandatangani",
				);
			}

			const currentStep = letter.currentStep!;

			const rollbackToStep = calculateRollbackStep(currentStep);

			const comment =
				typeof body.comment === "string" && body.comment.trim().length > 0
					? body.comment.trim()
					: "Mahasiswa mengajukan revisi sendiri";

			await Prisma.letterInstance.update({
				where: { id },
				data: {
					currentStep: rollbackToStep,
				},
			});

			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "SELF_REVISED",
					step: null,
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment,
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
					message: `Surat dikembalikan ke step ${rollbackToStep}. Silakan edit data dan resubmit.`,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				comment: t.Optional(t.String()),
			}),
		},
	);
