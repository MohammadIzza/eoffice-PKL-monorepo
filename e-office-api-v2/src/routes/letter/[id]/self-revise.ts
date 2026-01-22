// Endpoint: Self-revise oleh mahasiswa (rollback 1 step)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { calculateRollbackStep } from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, user }) => {
			// 1. Get letter
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			// 2. Validate: hanya pembuat surat
			if (letter.createdById !== user.id) {
				throw new Error("Anda tidak berhak merevisi surat ini");
			}

			// 3. Validate: status PROCESSING
			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

			// 4. Validate: belum ditandatangani
			if (letter.signedAt) {
				throw new Error(
					"Surat tidak dapat direvisi karena sudah ditandatangani",
				);
			}

			const currentStep = letter.currentStep!;

			// 5. Calculate rollback target (mundur 1 step)
			const rollbackToStep = calculateRollbackStep(currentStep);

			// 6. Update letter: rollback currentStep
			await Prisma.letterInstance.update({
				where: { id },
				data: {
					currentStep: rollbackToStep,
				},
			});

			// 7. Record SELF_REVISED action
			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "SELF_REVISED",
					step: null,  // Mahasiswa bukan step approval
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment: "Mahasiswa mengajukan revisi sendiri",
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
		},
	);
