import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { DocumentService } from "@backend/services/document.service.ts";
import { MinioService } from "@backend/services/minio.service.ts";
import {
	validateUserIsAssignee,
	PKL_WORKFLOW_STEPS,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	// GET editable document HTML untuk Supervisor Akademik
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

			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

			const currentStep = letter.currentStep!;

			// Hanya Supervisor Akademik (step 5) yang bisa edit
			if (currentStep !== PKL_WORKFLOW_STEPS.SUPERVISOR_AKADEMIK) {
				throw new Error("Dokumen hanya bisa diedit oleh Supervisor Akademik");
			}

			validateUserIsAssignee(letter, user.id, currentStep);

			// Get latest editable version HTML
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

			let editableHTML: string;
			let currentVersion = letter.latestEditableVersion || 1;

			// Cari editable version terbaru
			const latestEditable = documentVersions
				?.filter((v) => v.isEditable && v.storageKey)
				.sort((a, b) => b.version - a.version)[0];

			if (latestEditable && latestEditable.storageKey) {
				// Get HTML dari Minio menggunakan getFileStream
				try {
					const { stat, stream } = await MinioService.getFileStream(latestEditable.storageKey);
					
					// Convert stream to string
					const chunks: Uint8Array[] = [];
					for await (const chunk of stream) {
						chunks.push(chunk);
					}
					const buffer = Buffer.concat(chunks);
					editableHTML = buffer.toString("utf-8");
					currentVersion = latestEditable.version;
				} catch (error) {
					console.error("Error downloading editable version:", error);
					// Fallback: generate dari template
					editableHTML = await DocumentService.generateHTML(letter);
				}
			} else {
				// Generate dari template jika belum ada editable version
				editableHTML = await DocumentService.generateHTML(letter);
			}

			return {
				success: true,
				message: "Editable document berhasil diambil",
				data: {
					letterId: letter.id,
					html: editableHTML,
					version: currentVersion,
					canEdit: true,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	// POST save draft (tidak create version baru)
	.post(
		"/draft",
		async ({ params: { id }, body, user }) => {
			const { html } = body;

			if (!html || typeof html !== "string") {
				throw new Error("HTML content diperlukan");
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

			if (currentStep !== PKL_WORKFLOW_STEPS.SUPERVISOR_AKADEMIK) {
				throw new Error("Dokumen hanya bisa diedit oleh Supervisor Akademik");
			}

			validateUserIsAssignee(letter, user.id, currentStep);

			// Save draft ke Minio (tidak update documentVersions)
			const fs = await import("node:fs");
			const tempFilePath = `./uploads/draft_${letter.id}_${Date.now()}.html`;
			
			try {
				// Ensure uploads directory exists
				if (!fs.existsSync("./uploads")) {
					fs.mkdirSync("./uploads", { recursive: true });
				}

				fs.writeFileSync(tempFilePath, html, "utf-8");

				const fileBuffer = fs.readFileSync(tempFilePath);
				const htmlFile = new File([fileBuffer], `draft_${letter.id}.html`, { type: "text/html" });

				const result = await MinioService.uploadFile(
					htmlFile,
					`letters/${letter.id}/drafts/`,
					"text/html",
				);

				// Cleanup
				fs.unlinkSync(tempFilePath);

				return {
					success: true,
					message: "Draft berhasil disimpan",
					data: {
						letterId: letter.id,
						draftUrl: result.url,
						timestamp: new Date().toISOString(),
					},
				};
			} catch (error) {
				// Cleanup on error
				if (fs.existsSync(tempFilePath)) {
					fs.unlinkSync(tempFilePath);
				}
				throw error;
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				html: t.String(),
			}),
		},
	)
	// POST publish version (create new version, generate PDF)
	.post(
		"/publish",
		async ({ params: { id }, body, user }) => {
			const { html, comment } = body;

			if (!html || typeof html !== "string") {
				throw new Error("HTML content diperlukan");
			}

			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
				include: {
					numbering: true,
				},
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			if (letter.status !== "PROCESSING") {
				throw new Error("Surat tidak dalam status PROCESSING");
			}

			const currentStep = letter.currentStep!;

			if (currentStep !== PKL_WORKFLOW_STEPS.SUPERVISOR_AKADEMIK) {
				throw new Error("Dokumen hanya bisa dipublish oleh Supervisor Akademik");
			}

			validateUserIsAssignee(letter, user.id, currentStep);

			const userRoles = await Prisma.userRole.findFirst({
				where: { userId: user.id },
				include: { role: true },
			});
			const actorRole = userRoles?.role.name || "unknown";

			// Increment version
			const newVersion = (letter.latestEditableVersion || 1) + 1;

			// Save HTML version ke Minio
			const fs = await import("node:fs");
			const htmlStorageKey = `letters/${letter.id}/document_v${newVersion}.html`;
			const tempHtmlPath = `./uploads/publish_${letter.id}_${Date.now()}.html`;

			try {
				// Ensure uploads directory exists
				if (!fs.existsSync("./uploads")) {
					fs.mkdirSync("./uploads", { recursive: true });
				}

				fs.writeFileSync(tempHtmlPath, html, "utf-8");

				const fileBuffer = fs.readFileSync(tempHtmlPath);
				const htmlFile = new File([fileBuffer], `document_v${newVersion}.html`, { type: "text/html" });

				const htmlResult = await MinioService.uploadFile(
					htmlFile,
					`letters/${letter.id}/`,
					"text/html",
				);

				// Update documentVersions
				const documentVersions = (letter.documentVersions as Array<{
					version: number;
					storageKey: string | null;
					format: string;
					createdBy: string;
					reason: string;
					timestamp: string;
					isPDF: boolean;
					isEditable: boolean;
				}>) || [];

				const newVersionEntry = {
					version: newVersion,
					storageKey: `letters/${letter.id}/${htmlResult.nameReplace}`,
					format: "HTML",
					createdBy: user.id,
					reason: "PUBLISHED_BY_SUPERVISOR",
					timestamp: new Date().toISOString(),
					isPDF: false,
					isEditable: true,
				};

				documentVersions.push(newVersionEntry);

				// Update letter
				await Prisma.letterInstance.update({
					where: { id },
					data: {
						latestEditableVersion: newVersion,
						documentVersions: documentVersions,
					},
				});

				// Create history entry
				await Prisma.letterStepHistory.create({
					data: {
						letterId: letter.id,
						action: "DOCUMENT_PUBLISHED",
						step: currentStep,
						actorUserId: user.id,
						actorRole: actorRole,
						comment: comment || null,
						fromStep: currentStep,
						toStep: currentStep, // Masih di step yang sama
						metadata: {
							version: newVersion,
							reason: "PUBLISHED_BY_SUPERVISOR",
						},
					},
				});

				// Cleanup
				fs.unlinkSync(tempHtmlPath);

				return {
					success: true,
					message: "Versi dokumen berhasil dipublish",
					data: {
						letterId: letter.id,
						version: newVersion,
						storageKey: newVersionEntry.storageKey,
						timestamp: newVersionEntry.timestamp,
					},
				};
			} catch (error) {
				// Cleanup on error
				if (fs.existsSync(tempHtmlPath)) {
					fs.unlinkSync(tempHtmlPath);
				}
				throw error;
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				html: t.String(),
				comment: t.Optional(t.String()),
			}),
		},
	);
