import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { MinioService } from "@backend/services/minio.service.ts";
import { DocumentService } from "@backend/services/document.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async ({ params: { id }, user }) => {
			const letter = await Prisma.letterInstance.findUnique({
			where: { id },
			include: {
				letterType: true,
				numbering: true,
				createdBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			const isCreator = letter.createdById === user.id;

			const hasApproved = await Prisma.letterStepHistory.findFirst({
				where: {
					letterId: letter.id,
					actorUserId: user.id,
					action: { in: ["APPROVED", "REJECTED", "REVISED"] },
				},
			});

			if (!isCreator && !hasApproved) {
				const assignedApprovers = letter.assignedApprovers as Record<string, string> | null;
				const isAssignee = assignedApprovers
					? Object.values(assignedApprovers).includes(user.id)
					: false;

				if (!isAssignee) {
					throw new Error("Anda tidak berhak melihat preview surat ini");
				}
			}

			const documentVersions = letter.documentVersions as Array<{
				version: number;
				storageKey: string | null;
				format: string;
				createdBy: string;
				reason: string;
				timestamp: string;
				isPDF: boolean;
				isEditable: boolean;
			}> | null;

			// Jika belum ada document version atau storageKey null, generate HTML on-the-fly
			if (!documentVersions || documentVersions.length === 0 || 
				!documentVersions.some(v => v.storageKey)) {
			// Generate HTML on-the-fly
			const html = await DocumentService.generateHTML(letter);
			
			// Return HTML langsung (base64 encoded untuk response)
			const htmlBase64 = Buffer.from(html).toString("base64");
			
			return {
				success: true,
				message: "Preview dokumen berhasil di-generate",
				data: {
					letterId: letter.id,
					preview: {
						version: letter.latestEditableVersion || 1,
						format: "HTML",
						isPDF: false,
						isEditable: true,
						createdBy: "system",
						reason: "ON_THE_FLY_GENERATION",
						timestamp: new Date().toISOString(),
						previewUrl: `data:text/html;base64,${htmlBase64}`,
						htmlContent: html, // Include HTML content directly
						expiresIn: 3600,
					},
				},
			};
		}

			// Prioritas: PDF terbaru > Editable terbaru
			const latestPDF = documentVersions
			.filter((v) => v.isPDF && v.storageKey)
			.sort((a, b) => b.version - a.version)[0];

		const latestEditable = documentVersions
			.filter((v) => v.isEditable && v.storageKey)
			.sort((a, b) => b.version - a.version)[0];

		const latestVersion = latestPDF || latestEditable || documentVersions.find(v => v.storageKey);

		if (!latestVersion || !latestVersion.storageKey) {
			// Fallback: generate HTML on-the-fly
			const html = await DocumentService.generateHTML(letter);
			const htmlBase64 = Buffer.from(html).toString("base64");
			
			return {
				success: true,
				message: "Preview dokumen berhasil di-generate",
				data: {
					letterId: letter.id,
					preview: {
						version: letter.latestEditableVersion || 1,
						format: "HTML",
						isPDF: false,
						isEditable: true,
						createdBy: "system",
						reason: "ON_THE_FLY_GENERATION",
						timestamp: new Date().toISOString(),
						previewUrl: `data:text/html;base64,${htmlBase64}`,
						htmlContent: html,
						expiresIn: 3600,
					},
				},
			};
		}

		const previewUrl = await MinioService.getPresignedUrl(
			"",
			latestVersion.storageKey,
			1 * 60 * 60,
		);

		return {
			success: true,
			message: "Preview dokumen berhasil diambil",
			data: {
				letterId: letter.id,
				preview: {
					version: latestVersion.version,
					format: latestVersion.format,
					isPDF: latestVersion.isPDF,
					isEditable: latestVersion.isEditable,
					createdBy: latestVersion.createdBy,
					reason: latestVersion.reason,
					timestamp: latestVersion.timestamp,
					previewUrl: previewUrl,
					expiresIn: 3600,
				},
			},
		};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
