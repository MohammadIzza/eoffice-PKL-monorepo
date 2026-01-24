import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { MinioService } from "@backend/services/minio.service.ts";
import {
	validateUserIsAssignee,
	PKL_WORKFLOW_STEPS,
	STEP_TO_ROLE,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { comment, signatureData } = body;

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

		// Enforce mandatory attachments before first approval
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
				if (!signatureData) {
					throw new Error("Tanda tangan diperlukan untuk Wakil Dekan");
				}

			if (!signatureData.data || typeof signatureData.data !== "string") {
				throw new Error("Data tanda tangan tidak valid");
			}

			const dataUrl = signatureData.data;
			const dataUrlMatch = dataUrl.match(/^data:(.+);base64,(.+)$/);
			const mimeType = dataUrlMatch?.[1] || "image/png";
			const base64Data = dataUrlMatch?.[2] || dataUrl;
			const buffer = Buffer.from(base64Data, "base64");
			const extension =
				mimeType === "image/jpeg"
					? "jpg"
					: mimeType === "image/png"
						? "png"
						: "png";

			const fileName = `signature_${letter.id}_${Date.now()}.${extension}`;
			const signatureFile = new File([buffer], fileName, { type: mimeType });
			const { url, nameReplace } = await MinioService.uploadFile(
				signatureFile,
				`signatures/${letter.id}/`,
				mimeType,
			);

			const signatureUrl = url;
			const signatureStorageKey = `signatures/${letter.id}/${nameReplace}`;

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
							method: signatureData.method || "UPLOAD",
						},
					},
				});
			}

		const nextStep =
			currentStep < PKL_WORKFLOW_STEPS.UPA ? currentStep + 1 : null;

		// Jika step terakhir (UPA), set status ke COMPLETED
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

			return {
				success: true,
				message: "Surat berhasil disetujui",
				data: {
					letterId: letter.id,
					currentStep: nextStep,
					nextStepRole: nextStep ? STEP_TO_ROLE[nextStep] : "COMPLETED",
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
