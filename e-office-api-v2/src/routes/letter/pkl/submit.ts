import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import {
	determineApproversForPKL,
	validateOnlyOneActiveLetter,
	PKL_WORKFLOW_STEPS,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ body, user }) => {
			const {
				prodiId,
				dosenPembimbingUserId,
				formData,
			} = body;

			await validateOnlyOneActiveLetter(user.id);

			const assignedApprovers = await determineApproversForPKL(
				prodiId,
				dosenPembimbingUserId,
			);

			let letterTypePKL = await Prisma.letterType.findFirst({
				where: { name: "PKL" },
			});

			if (!letterTypePKL) {
				letterTypePKL = await Prisma.letterType.create({
					data: {
						name: "PKL",
						description: "Surat Pengantar PKL",
					},
				});
			}

			const letter = await Prisma.letterInstance.create({
				data: {
					letterTypeId: letterTypePKL.id,
					createdById: user.id,
					schema: {},
					values: formData,
					status: "PROCESSING",
					currentStep: PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING,
					assignedApprovers: assignedApprovers,
					documentVersions: [
						{
							version: 1,
							storageKey: null,
							format: "HTML",
							createdBy: "system",
							reason: "SUBMIT",
							timestamp: new Date().toISOString(),
							isPDF: false,
							isEditable: true,
						},
					],
					latestEditableVersion: 1,
				},
			});

			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "SUBMITTED",
					step: null,
					actorUserId: user.id,
					actorRole: "mahasiswa",
					comment: null,
					fromStep: null,
					toStep: PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING,
					metadata: {
						assignedApprovers,
					},
				},
			});

			return {
				success: true,
				message: "Surat PKL berhasil diajukan",
				data: {
					letterId: letter.id,
					status: letter.status,
					currentStep: letter.currentStep,
					assignedApprovers: letter.assignedApprovers,
				},
			};
		},
		{
			...requirePermission("letter", "create"),
			body: t.Object({
				prodiId: t.String(),
				dosenPembimbingUserId: t.String(),
				formData: t.Any(),
			}),
		},
	);
