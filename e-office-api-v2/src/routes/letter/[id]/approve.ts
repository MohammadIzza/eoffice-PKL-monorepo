import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
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

			const userRoles = await Prisma.userRole.findFirst({
				where: { userId: user.id },
				include: { role: true },
			});

			const actorRole = userRoles?.role.name || "unknown";

			if (currentStep === PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1) {
				if (!signatureData) {
					throw new Error("Tanda tangan diperlukan untuk Wakil Dekan");
				}

				const signatureUrl = "minio://signatures/temp.png";

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
							method: signatureData.method || "UPLOAD",
						},
					},
				});
			}

			const nextStep =
				currentStep < PKL_WORKFLOW_STEPS.UPA ? currentStep + 1 : null;

			await Prisma.letterInstance.update({
				where: { id },
				data: {
					currentStep: nextStep,
				},
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
