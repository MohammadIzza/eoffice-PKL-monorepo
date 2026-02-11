import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { notificationService } from "@backend/services/notification.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { formData } = body;

			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			if (letter.createdById !== user.id) {
				throw new Error("Anda tidak berhak mengubah surat ini");
			}

			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

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

			await Prisma.letterInstance.update({
				where: { id },
				data: {
					values: formData,
				},
			});

			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "RESUBMITTED",
					step: letter.currentStep,
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment: "Mahasiswa mengirim ulang surat setelah revisi",
					fromStep: letter.currentStep,
					toStep: letter.currentStep,
				},
			});

			// Kirim notifikasi ke approver di current step
			try {
				const assignedApprovers = letter.assignedApprovers as Record<string, any>;
				const stepRoleMap: Record<number, string> = {
					1: "dospem",
					2: "koordinator",
					3: "kaprodi",
					4: "admin",
					5: "supervisor",
					6: "manajer",
					7: "wd1",
					8: "upa",
				};
				const currentRoleKey = stepRoleMap[letter.currentStep!];
				if (currentRoleKey && assignedApprovers[currentRoleKey]) {
					await notificationService.create(
						assignedApprovers[currentRoleKey],
						"Surat Siap untuk Review",
						`Mahasiswa telah melakukan perbaikan dan mengirim ulang surat PKL. Silakan review kembali.`,
						`/dashboard/approval/${letter.id}`,
						"INFO",
					);
				}
			} catch (e) {
				console.error("Gagal mengirim notifikasi resubmit:", e);
			}

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
				formData: t.Any(),
			}),
		},
	);
