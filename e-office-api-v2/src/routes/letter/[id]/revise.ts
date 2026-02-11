import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import {
	validateUserIsAssignee,
	calculateRollbackStep,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { notificationService } from "@backend/services/notification.service.ts";
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

			validateUserIsAssignee(letter, user.id, currentStep);

			const rollbackToStep = calculateRollbackStep(currentStep);

			const userRoles = await Prisma.userRole.findFirst({
				where: { userId: user.id },
				include: { role: true },
			});
			const actorRole = userRoles?.role.name || "unknown";

			await Prisma.letterInstance.update({
				where: { id },
				data: {
					currentStep: rollbackToStep,
				},
			});

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

			// Kirim notifikasi ke mahasiswa
			try {
				await notificationService.create(
					letter.createdById,
					"Surat Perlu Revisi",
					`Surat PKL Anda dikembalikan untuk revisi. Catatan: "${comment}". Silakan perbaiki dan kirim ulang.`,
					`/dashboard/surat/${letter.id}`,
					"WARNING",
				);
			} catch (e) {
				console.error("Gagal mengirim notifikasi revise ke mahasiswa:", e);
			}

			// Kirim notifikasi ke approver di rollback step (yang perlu approve ulang)
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
				const rollbackRoleKey = stepRoleMap[rollbackToStep];
				if (rollbackRoleKey && assignedApprovers[rollbackRoleKey]) {
					await notificationService.create(
						assignedApprovers[rollbackRoleKey],
						"Surat Dikembalikan untuk Review Ulang",
						`Surat PKL yang sebelumnya Anda setujui dikembalikan untuk revisi. Silakan review ulang setelah mahasiswa mengirim perbaikan.`,
						`/dashboard/approval/${letter.id}`,
						"INFO",
					);
				}
			} catch (e) {
				console.error("Gagal mengirim notifikasi revise ke approver:", e);
			}

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
