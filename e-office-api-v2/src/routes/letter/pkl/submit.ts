// Endpoint: Submit surat PKL oleh mahasiswa
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

			// 1. Validasi: mahasiswa belum punya surat PKL aktif
			await validateOnlyOneActiveLetter(user.id);

			// 2. Determine assigned approvers untuk workflow
			const assignedApprovers = await determineApproversForPKL(
				prodiId,
				dosenPembimbingUserId,
			);

			// 3. Get LetterType PKL (hardcode untuk fase ini)
			let letterTypePKL = await Prisma.letterType.findFirst({
				where: { name: "PKL" },
			});

			if (!letterTypePKL) {
				// Create if not exists (first time)
				letterTypePKL = await Prisma.letterType.create({
					data: {
						name: "PKL",
						description: "Surat Pengantar PKL",
					},
				});
			}

			// 4. Create LetterInstance
			const letter = await Prisma.letterInstance.create({
				data: {
					letterTypeId: letterTypePKL.id,
					createdById: user.id,
					schema: {},  // TODO: get from template
					values: formData,
					status: "PROCESSING",
					currentStep: PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING,  // Start di step 1
					assignedApprovers: assignedApprovers,
					documentVersions: [
						{
							version: 1,
							storageKey: null,  // TODO: generate document
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

			// 5. Create step history (SUBMITTED)
			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "SUBMITTED",
					step: null,  // Mahasiswa submit bukan step approval
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
			...requirePermission("letter", "create"),  // Sesuai permission di seed
			body: t.Object({
				prodiId: t.String(),
				dosenPembimbingUserId: t.String(),
				formData: t.Any(),  // Form data PKL (dynamic)
			}),
		},
	);
