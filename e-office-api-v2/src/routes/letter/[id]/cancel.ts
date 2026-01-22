// Endpoint: Cancel surat (mahasiswa, sebelum TTD WD1)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
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

			// 2. Validate: hanya pembuat surat yang bisa cancel
			if (letter.createdById !== user.id) {
				throw new Error("Anda tidak berhak membatalkan surat ini");
			}

			// 3. Validate: belum ditandatangani (sebelum WD1 TTD)
			if (letter.signedAt) {
				throw new Error(
					"Surat tidak dapat dibatalkan karena sudah ditandatangani",
				);
			}

			// 4. Validate: status masih bisa dibatalkan
			if (["COMPLETED", "REJECTED", "CANCELLED"].includes(letter.status)) {
				throw new Error(`Surat dengan status ${letter.status} tidak dapat dibatalkan`);
			}

			// 5. Update status = CANCELLED
			await Prisma.letterInstance.update({
				where: { id },
				data: {
					status: "CANCELLED",
				},
			});

			// 6. Record CANCELLED action
			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "CANCELLED",
					step: null,
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment: null,
					fromStep: letter.currentStep,
					toStep: null,  // Terminal
				},
			});

			return {
				success: true,
				message: "Surat berhasil dibatalkan",
				data: {
					letterId: letter.id,
					status: "CANCELLED",
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
