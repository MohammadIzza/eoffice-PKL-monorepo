// Endpoint: Resubmit surat setelah revise (update values)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { formData } = body;

			// 1. Get letter
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			// 2. Validate: hanya pembuat surat
			if (letter.createdById !== user.id) {
				throw new Error("Anda tidak berhak mengubah surat ini");
			}

			// 3. Validate: status PROCESSING
			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

			// 4. Validate: surat sudah pernah di-revise (ada action REVISED atau SELF_REVISED)
			const hasRevisedHistory = await Prisma.letterStepHistory.findFirst({
				where: {
					letterId: letter.id,
					action: { in: ["REVISED", "SELF_REVISED"] },
				},
			});

			if (!hasRevisedHistory) {
				throw new Error(
					"Surat belum pernah di-revise. Gunakan submit untuk pengajuan baru.",
				);
			}

			// 5. Update values (sync dengan dokumen terakhir jika ada)
			await Prisma.letterInstance.update({
				where: { id },
				data: {
					values: formData,  // Update values dengan data baru
					// Note: documentVersions tetap pakai versi terakhir (jika sudah ada edit supervisor)
				},
			});

			// 6. Record RESUBMITTED action (optional, untuk tracking)
			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "RESUBMITTED",
					step: letter.currentStep,
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment: "Mahasiswa mengirim ulang surat setelah revisi",
					fromStep: letter.currentStep,
					toStep: letter.currentStep,  // Tetap di step yang sama, menunggu approve ulang
				},
			});

			return {
				success: true,
				message: "Surat berhasil dikirim ulang",
				data: {
					letterId: letter.id,
					currentStep: letter.currentStep,
					message: "Data surat telah diperbarui. Silakan tunggu approval dari step yang terdampak.",
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				formData: t.Any(),  // Form data PKL (dynamic, sama seperti submit)
			}),
		},
	);
