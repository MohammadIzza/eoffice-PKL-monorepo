import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import {
	validateUserIsAssignee,
    getAssigneeForStep,
	calculateRollbackStep,
	PKL_WORKFLOW_STEPS,
	STEP_TO_ROLE,
	STEP_ROLE_LABEL,
} from "@backend/services/workflow/pkl.workflow.service";
import { notificationService } from "@backend/services/notification.service";
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

            // 1. Notifikasi ke DIRI SENDIRI (Actor)
            try {
                const selfStepRole = STEP_TO_ROLE[currentStep as keyof typeof STEP_TO_ROLE];
                const selfStepName = selfStepRole ? (STEP_ROLE_LABEL[selfStepRole] || selfStepRole) : `Step ${currentStep}`;
                const selfStudentName = (letter.values as any)?.namaLengkap || "Mahasiswa";

                // Revisi: Dospem (1) s/d Wakil Dekan (7)
                if (currentStep >= PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING && currentStep <= PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1) {
                    await notificationService.create(
                        user.id,
                        "Permintaan Revisi Terkirim",
                        `Anda telah berhasil meminta revisi surat PKL ${selfStudentName} pada tahap ${selfStepName}.`,
                        `/dashboard/approval/${letter.id}`,
                        "WARNING",
                    );
                }
            } catch (e) {
                console.error("Gagal mengirim notifikasi self-revise:", e);
            }

			// 2. Notifikasi ke MAHASISWA & PREVIOUS APPROVER
			try {
				const studentName = (letter.values as any)?.namaLengkap || "Mahasiswa";
				await notificationService.create(
					letter.createdById,
					"Surat Perlu Revisi",
					`Surat PKL ${studentName} dikembalikan untuk revisi. Catatan: "${comment}". Silakan perbaiki dan kirim ulang.`,
					`/dashboard/surat/${letter.id}`,
					"WARNING",
				);
			} catch (e) {
				console.error("Gagal mengirim notifikasi revise ke mahasiswa:", e);
			}

			// Kirim notifikasi ke approver di rollback step (yang perlu approve ulang)
			try {
				const studentName = (letter.values as any)?.namaLengkap || "Mahasiswa";
				const assignedApprovers = letter.assignedApprovers as Record<string, string>;
				// Kembalikan stepRoleMap sesuai permintaan user
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

                // Gunakan helper getAssigneeForStep untuk robustness (prioritas: key dari map, lalu logic internal)
                let rollbackAssigneeId = getAssigneeForStep(assignedApprovers, rollbackToStep);
                
                // Fallback jika getAssigneeForStep gagal tapi map punya key (meski getAssigneeForStep harusnya sudah cover)
                if (!rollbackAssigneeId && stepRoleMap[rollbackToStep]) {
                     rollbackAssigneeId = assignedApprovers[stepRoleMap[rollbackToStep]];
                }
				
				if (rollbackAssigneeId) {
					await notificationService.create(
						rollbackAssigneeId,
						"Surat Dikembalikan untuk Review Ulang",
						`Surat PKL ${studentName} yang sebelumnya Anda setujui dikembalikan untuk revisi. Silakan review ulang setelah mahasiswa mengirim perbaikan.`,
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
