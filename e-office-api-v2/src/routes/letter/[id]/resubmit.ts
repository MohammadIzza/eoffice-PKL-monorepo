import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { notificationService } from "@backend/services/notification.service";
import { getAssigneeForStep } from "@backend/services/workflow/pkl.workflow.service";
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
				// 1. Notifikasi ke DIRI SENDIRI (Mahasiswa)
				const studentName = (letter.values as any)?.namaLengkap || "Mahasiswa";
				await notificationService.create(
					user.id,
					"Revisi Terkirim",
					`Anda telah berhasil mengirimkan perbaikan revisi surat PKL.`,
					`/dashboard/surat/${letter.id}`,
					"SUCCESS",
				);

				const assignedApprovers = letter.assignedApprovers as Record<string, string>;
				const stepRoleMap: Record<number, string> = {
					1: "dospem",
					2: "koordinator",
					3: "kaprodi",
					4: "adminFakultas",
					5: "supervisor",
					6: "manajerTu",
					7: "wakilDekan1",
					8: "upa",
				};

				let currentAssigneeId = getAssigneeForStep(assignedApprovers, letter.currentStep!);

				if (!currentAssigneeId && stepRoleMap[letter.currentStep!]) {
					currentAssigneeId = assignedApprovers[stepRoleMap[letter.currentStep!]];
				}

				if (currentAssigneeId) {
					await notificationService.create(
						currentAssigneeId,
						"Surat Siap untuk Review",
						`Surat PKL ${studentName} telah diperbaiki dan siap untuk review ulang.`,
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
