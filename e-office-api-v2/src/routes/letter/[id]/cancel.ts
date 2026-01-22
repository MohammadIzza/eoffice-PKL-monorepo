import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, user }) => {
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			if (letter.createdById !== user.id) {
				throw new Error("Anda tidak berhak membatalkan surat ini");
			}

			if (letter.signedAt) {
				throw new Error(
					"Surat tidak dapat dibatalkan karena sudah ditandatangani",
				);
			}

			if (["COMPLETED", "REJECTED", "CANCELLED"].includes(letter.status)) {
				throw new Error(`Surat dengan status ${letter.status} tidak dapat dibatalkan`);
			}

			await Prisma.letterInstance.update({
				where: { id },
				data: {
					status: "CANCELLED",
				},
			});

			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "CANCELLED",
					step: null,
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment: null,
					fromStep: letter.currentStep,
					toStep: null,
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
