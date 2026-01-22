import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { MinioService } from "@backend/services/minio.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { files, category, replaceExisting } = body;

			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			// 2. Validate: hanya pembuat surat atau assignee yang bisa upload
			const isCreator = letter.createdById === user.id;
			const currentStep = letter.currentStep;
			const assignedApprovers = letter.assignedApprovers as Record<string, string> | null;
			const isAssignee = currentStep && assignedApprovers
				? Object.values(assignedApprovers).includes(user.id)
				: false;

			if (!isCreator && !isAssignee) {
				throw new Error("Anda tidak berhak mengunggah lampiran untuk surat ini");
			}

			if (letter.status !== "PROCESSING") {
				throw new Error("Lampiran hanya bisa diunggah untuk surat dalam status PROCESSING");
			}

			if (replaceExisting && category) {
				await Prisma.attachment.updateMany({
					where: {
						letterId: letter.id,
						category: category,
						isActive: true,
					},
					data: {
						isActive: false,
						deletedAt: new Date(),
					},
				});
			}

			const uploadedAttachments = [];

			for (const file of files) {
				const { url, nameReplace } = await MinioService.uploadFile(
					file,
					`attachments/${letter.id}/`,
					file.type || "application/octet-stream",
				);

				const attachment = await Prisma.attachment.create({
					data: {
						domain: "letter",
						filename: nameReplace,
						letterId: letter.id,
						category: category || null,
						uploadedByUserId: user.id,
						isActive: true,
					},
				});

				uploadedAttachments.push({
					id: attachment.id,
					filename: nameReplace,
					originalName: file.name,
					category: attachment.category,
					url: url,
					uploadedAt: attachment.createdAt,
				});
			}

			return {
				success: true,
				message: "Lampiran berhasil diunggah",
				data: {
					letterId: letter.id,
					attachments: uploadedAttachments,
					totalUploaded: uploadedAttachments.length,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				files: t.Array(t.File()),
				category: t.Optional(t.String()),
				replaceExisting: t.Optional(t.Boolean()),
			}),
		},
	);
