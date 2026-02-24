import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { validateUserIsAssignee, PKL_WORKFLOW_STEPS } from "@backend/services/workflow/pkl.workflow.service";
import { notificationService } from "@backend/services/notification.service";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { comment } = body;

			if (!comment || comment.trim().length < 10) {
				throw new Error("Komentar wajib diisi minimal 10 karakter untuk penolakan");
			}

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

			const userRoles = await Prisma.userRole.findFirst({
				where: { userId: user.id },
				include: { role: true },
			});
			const actorRole = userRoles?.role.name || "unknown";

			await Prisma.letterInstance.update({
				where: { id },
				data: {
					status: "REJECTED",
				},
			});

			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "REJECTED",
					step: currentStep,
					actorUserId: user.id,
					actorRole: actorRole,
					comment: comment,
					fromStep: currentStep,
					toStep: null,
				},
			});

            // 1. Notifikasi ke DIRI SENDIRI (Actor)
            try {
                // Tolak: Dospem (1) s/d Wakil Dekan (7)
                if (currentStep >= PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING && currentStep <= PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1) {
                    await notificationService.create(
                        user.id,
                        "Penolakan Berhasil",
                        "Anda telah berhasil menolak surat PKL ini.",
                        `/dashboard/approval/${letter.id}`,
                        "ERROR",
                    );
                }
            } catch (e) {
                console.error("Gagal mengirim notifikasi self-reject:", e);
            }

			// 2. Notifikasi ke MAHASISWA
			try {
				await notificationService.create(
					letter.createdById,
					"Surat Ditolak",
					`Surat PKL Anda dikembalikan dengan catatan: "${comment}"`,
					`/dashboard/surat/${letter.id}`,
					"WARNING",
				);
			} catch (e) {
				console.error("Gagal mengirim notifikasi rejection:", e);
			}

			return {
				success: true,
				message: "Surat ditolak",
				data: {
					letterId: letter.id,
					status: "REJECTED",
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
