import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { MinioService } from "@backend/services/minio.service";
import {
    validateUserIsAssignee,
    getAssigneeForStep,
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
            const { comment, signatureData } = body;
            const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;
            const ALLOWED_SIGNATURE_MIME = new Set(["image/png", "image/jpeg", "image/jpg"]);

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

            if (currentStep === PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING) {
                const attachments = await Prisma.attachment.findMany({
                    where: {
                        letterId: letter.id,
                        isActive: true,
                    },
                    select: { category: true },
                });

                const hasProposal = attachments.some((a) => a.category === "proposal");
                const hasKtm = attachments.some((a) => a.category === "ktm");
                const utamaCount = attachments.filter((a) => a.category === "utama").length;

                if ((!hasProposal || !hasKtm) && utamaCount < 2) {
                    throw new Error(
                        "Lampiran Proposal dan KTM wajib diunggah sebelum approval",
                    );
                }
            }

            const userRoles = await Prisma.userRole.findFirst({
                where: { userId: user.id },
                include: { role: true },
            });

            const actorRole = userRoles?.role.name || "unknown";

            if (currentStep === PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1) {
                let signatureUrl = "";
                let signatureStorageKey = "";

                // Fetch fresh user data to see if they have a saved signature
                const currentUserInfo = await Prisma.user.findUnique({
                    where: { id: user.id },
                    select: { signatureUrl: true }
                });

                // Case 1: User provides new signature data -> Use it & Save to Profile
                if (signatureData && signatureData.method !== 'SAVED') {
                    if (!signatureData.data || typeof signatureData.data !== "string") {
                        throw new Error("Data tanda tangan tidak valid");
                    }

                    const dataUrl = signatureData.data;
                    const dataUrlMatch = dataUrl.match(/^data:(.+);base64,(.+)$/);
                    if (!dataUrlMatch) {
                        throw new Error("Format tanda tangan tidak valid. Gunakan data URL base64.");
                    }

                    const mimeType = dataUrlMatch[1];
                    if (!ALLOWED_SIGNATURE_MIME.has(mimeType)) {
                        throw new Error("Format tanda tangan harus PNG atau JPG");
                    }

                    const base64Data = dataUrlMatch[2];
                    const buffer = Buffer.from(base64Data, "base64");
                    if (!buffer.length) {
                        throw new Error("Data tanda tangan tidak valid");
                    }
                    if (buffer.length > MAX_SIGNATURE_BYTES) {
                        throw new Error("Ukuran tanda tangan maksimal 2MB");
                    }

                    const extension =
                        mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" : "png";

                    const fileName = `signature_${letter.id}_${Date.now()}.${extension}`;
                    const signatureFile = new File([buffer], fileName, { type: mimeType });
                    
                    // Upload for this specific letter
                    const result = await MinioService.uploadFile(
                        signatureFile,
                        `signatures/${letter.id}/`,
                        mimeType,
                    );
                    
                    signatureUrl = result.url;
                    signatureStorageKey = `signatures/${letter.id}/${result.nameReplace}`;

                    // Update User Profile with this new signature (Auto-save)
                    try {
                        const userSigFileName = `user_sig_${user.id}_${Date.now()}.${extension}`;
                        const userSigFile = new File([buffer], userSigFileName, { type: mimeType });
                        const userSigResult = await MinioService.uploadFile(
                             userSigFile, 
                             `users/${user.id}/signature/`, 
                             mimeType
                        );
                        
                        await Prisma.user.update({
                            where: { id: user.id },
                            data: { signatureUrl: userSigResult.url }
                        });
                    } catch (e) {
                        console.error("Failed to update user signature profile:", e);
                    }

                } 
                // Case 2: No new data, but User has saved signature -> Use it
                else if (currentUserInfo?.signatureUrl) {
                    signatureUrl = currentUserInfo.signatureUrl;
                    signatureStorageKey = "user-profile-signature"; // Marker 
                } 
                // Case 3: No signature at all -> Error
                else {
                     throw new Error("Tanda tangan diperlukan untuk Wakil Dekan. Silakan upload atau gambar tanda tangan Anda.");
                }

                await Prisma.letterInstance.update({
                    where: { id },
                    data: {
                        signedAt: new Date(),
                        signatureUrl: signatureUrl,
                    },
                });

                await Prisma.letterStepHistory.create({
                    data: {
                        letterId: letter.id,
                        action: "SIGNED",
                        step: currentStep,
                        actorUserId: user.id,
                        actorRole: actorRole,
                        comment: null,
                        metadata: {
                            signatureUrl,
                            signatureStorageKey,
                            method: signatureData?.method || "SAVED_PROFILE",
                        },
                    },
                });
            }

            const nextStep = currentStep < PKL_WORKFLOW_STEPS.UPA ? currentStep + 1 : 9;

            const updateData: any = {
                currentStep: nextStep,
            };

            if (currentStep === PKL_WORKFLOW_STEPS.UPA) {
                updateData.status = "COMPLETED";
            }

            await Prisma.letterInstance.update({
                where: { id },
                data: updateData,
            });

            await Prisma.letterStepHistory.create({
                data: {
                    letterId: letter.id,
                    action: "APPROVED",
                    step: currentStep,
                    actorUserId: user.id,
                    actorRole: actorRole,
                    comment: comment || null,
                    fromStep: currentStep,
                    toStep: nextStep,
                },
            });

            // 1. Notifikasi ke DIRI SENDIRI (Actor)
            try {
                // Tanda tangan: Hanya Wakil Dekan (Step 7)
                if (currentStep === PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1) {
                    await notificationService.create(
                        user.id,
                        "Tanda Tangan Berhasil",
                        "Anda telah berhasil melakukan Tanda Tangan pada surat ini.",
                        `/dashboard/approval/${letter.id}`,
                        "SUCCESS",
                    );
                }
                // Approval biasa: Dospem (1) s/d Manajer TU (6)
                else if (currentStep >= PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING && currentStep <= PKL_WORKFLOW_STEPS.MANAJER_TU) {
                     await notificationService.create(
                        user.id,
                        "Persetujuan Berhasil",
                        "Anda telah berhasil menyetujui surat PKL ini.",
                        `/dashboard/approval/${letter.id}`,
                        "SUCCESS",
                    );
                }
                // Penomoran: UPA (Step 8)
                else if (currentStep === PKL_WORKFLOW_STEPS.UPA) {
                     await notificationService.create(
                        user.id,
                        "Penomoran Berhasil",
                        "Anda telah berhasil melakukan penomoran pada surat ini.",
                        `/dashboard/approval/${letter.id}`,
                        "SUCCESS",
                    );
                }
            } catch (e) {
                console.error("Gagal mengirim notifikasi self-approval:", e);
            }

            // 2. Notifikasi ke ORANG LAIN (Next Approver & Mahasiswa)
			try {
                const stepRole = STEP_TO_ROLE[currentStep as keyof typeof STEP_TO_ROLE];
                const stepName = stepRole ? (STEP_ROLE_LABEL[stepRole] || stepRole) : `Step ${currentStep}`;
				const studentName = (letter.values as any)?.namaLengkap || "Mahasiswa";
				
				// Notifikasi ke mahasiswa
				if (currentStep === PKL_WORKFLOW_STEPS.UPA) {
					// Surat selesai
					await notificationService.create(
						letter.createdById,
						"Surat PKL Selesai",
						`Selamat ${studentName}! Surat PKL Anda telah selesai diproses dan disetujui oleh semua pihak.`,
						`/dashboard/surat/${letter.id}`,
						"SUCCESS",
					);
				} else {
					// Masih ada step berikutnya
					await notificationService.create(
						letter.createdById,
						"Status Surat Diperbarui",
						`Surat PKL ${studentName} telah disetujui pada tahap ${stepName}. Menunggu proses selanjutnya.`,
						`/dashboard/surat/${letter.id}`,
						"SUCCESS",
					);
				}

				// Notifikasi ke approver berikutnya (jika bukan step terakhir)
				if (currentStep < PKL_WORKFLOW_STEPS.UPA) {
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

                    let nextAssigneeId = getAssigneeForStep(assignedApprovers, nextStep);

                    if (!nextAssigneeId && stepRoleMap[nextStep]) {
                        nextAssigneeId = assignedApprovers[stepRoleMap[nextStep]];
                    }
					
					if (nextAssigneeId) {
                        const nextStepRole = STEP_TO_ROLE[nextStep as keyof typeof STEP_TO_ROLE];
                        const nextStepName = nextStepRole ? (STEP_ROLE_LABEL[nextStepRole] || nextStepRole) : `Step ${nextStep}`;
						await notificationService.create(
							nextAssigneeId,
							"Surat Menunggu Persetujuan Anda",
							`Surat PKL telah disetujui pada tahap ${stepName}. Sekarang menunggu persetujuan Anda sebagai ${nextStepName}.`,
							`/dashboard/approval/${letter.id}`,
							"INFO",
						);
					}
				}
            } catch (e) {
                console.error("Gagal mengirim notifikasi approval:", e);
            }

            return {
                success: true,
                message: "Surat berhasil disetujui",
                data: {
                    letterId: letter.id,
                    currentStep: nextStep,
                    nextStepRole: nextStep <= PKL_WORKFLOW_STEPS.UPA ? STEP_TO_ROLE[nextStep as keyof typeof STEP_TO_ROLE] : "COMPLETED",
                },
            }; 
        },
        {
            params: t.Object({
                id: t.String(),
            }),
            body: t.Object({
                comment: t.Optional(t.String()),
                signatureData: t.Optional(
                    t.Object({
                        method: t.String(),
                        data: t.String(),
                    }),
                ),
            }),
        },
    );