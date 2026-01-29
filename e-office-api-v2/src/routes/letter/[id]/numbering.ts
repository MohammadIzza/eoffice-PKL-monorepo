import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { DocumentService } from "@backend/services/document.service.ts";
import { MinioService } from "@backend/services/minio.service.ts";
import { PdfService } from "@backend/services/pdf.service.ts";
import {
	validateUserIsAssignee,
	PKL_WORKFLOW_STEPS,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/suggestion",
		async ({ params: { id }, query }) => {
			const { date } = query;
			const targetDate = date ? new Date(date) : new Date();

			const lastNumbering = await Prisma.letterNumbering.findFirst({
				where: {
					letterTypeCode: "AK15",
					date: {
						gte: new Date(targetDate.setHours(0, 0, 0, 0)),
						lt: new Date(targetDate.setHours(23, 59, 59, 999)),
					},
				},
				orderBy: {
					counter: "desc",
				},
			});

			const nextCounter = (lastNumbering?.counter || 0) + 1;
			const dd = String(targetDate.getDate()).padStart(2, "0");
			const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
			const yyyy = targetDate.getFullYear();

			const suggestion = `AK15-${String(nextCounter).padStart(2, "0")}/${dd}/${mm}/${yyyy}`;

			return {
				success: true,
				data: {
					suggestion,
					counter: nextCounter,
					date: targetDate,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			query: t.Object({
				date: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { numberString, date } = body;

			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			if (letter.status === "COMPLETED") {
				throw new Error("Surat sudah diterbitkan. Penomoran tidak dapat dilakukan lagi.");
			}

			if (letter.currentStep !== PKL_WORKFLOW_STEPS.UPA) {
				throw new Error("Penomoran hanya bisa dilakukan di step UPA");
			}

			validateUserIsAssignee(letter, user.id, PKL_WORKFLOW_STEPS.UPA);

			if (!letter.signedAt) {
				throw new Error("Surat belum ditandatangani, tidak bisa diberi nomor");
			}

			const targetDate = date ? new Date(date) : new Date();
			const match = numberString.match(/^AK15-(\d+)\//);
			const counter = match ? Number.parseInt(match[1], 10) : 1;

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

			let numberingRecord: { id: string } | null = null;

			try {
				numberingRecord = await Prisma.letterNumbering.create({
					data: {
						letterId: letter.id,
						letterTypeCode: "AK15",
						date: targetDate,
						counter: counter,
						numberString: numberString,
						assignedByUserId: user.id,
					},
				});
			} catch (error: any) {
				if (error.code === "P2002") {
					throw new Error(
						`Nomor surat ${numberString} sudah digunakan. Silakan gunakan nomor lain.`,
					);
				}
				throw error;
			}

			try {
				const latestEditable = documentVersions
					.filter((v) => v.isEditable && v.storageKey)
					.sort((a, b) => b.version - a.version)[0];
				const pdfVersion = latestEditable?.version || letter.latestEditableVersion || 1;

				let htmlContent = "";
				if (latestEditable?.storageKey) {
					const { stream } = await MinioService.getFileStream(latestEditable.storageKey);
					const chunks: Uint8Array[] = [];
					for await (const chunk of stream) {
						chunks.push(chunk);
					}
					htmlContent = Buffer.concat(chunks).toString("utf-8");
				} else {
					const letterWithNumbering = await Prisma.letterInstance.findUnique({
						where: { id: letter.id },
						include: { numbering: true },
					});
					if (!letterWithNumbering) {
						throw new Error("Surat tidak ditemukan saat generate PDF");
					}
					htmlContent = await DocumentService.generateHTML(letterWithNumbering);
				}

				const htmlWithNumber = htmlContent.replace(
					/Nomor:\s*[^<]*(<br\s*\/?>)/i,
					`Nomor: ${numberString}$1`,
				);

				const htmlWithSignature =
					letter.signatureUrl
						? htmlWithNumber.replace(
								/<img([^>]*alt=["']?Signature["']?[^>]*)>/i,
								(match) =>
									match.includes("src=")
										? match.replace(/src=["'][^"']*["']/, `src="${letter.signatureUrl}"`)
										: `<img src="${letter.signatureUrl}" ${match.replace("<img", "").replace(">", "").trim()}>`,
						  )
						: htmlWithNumber;

				const pdfBuffer = await PdfService.generatePdfFromHtml(htmlWithSignature);
				const pdfFile = new File(
					[pdfBuffer],
					`document_v${pdfVersion}.pdf`,
					{ type: "application/pdf" },
				);

				const pdfResult = await MinioService.uploadFile(
					pdfFile,
					`letters/${letter.id}/`,
					"application/pdf",
				);

				const updatedDocumentVersions = documentVersions.filter(
					(v) => !(v.isPDF && v.version === pdfVersion),
				);

				updatedDocumentVersions.push({
					version: pdfVersion,
					storageKey: `letters/${letter.id}/${pdfResult.nameReplace}`,
					format: "PDF",
					createdBy: user.id,
					reason: "FINAL_PDF_GENERATED",
					timestamp: new Date().toISOString(),
					isPDF: true,
					isEditable: false,
				});

				await Prisma.letterInstance.update({
					where: { id },
					data: {
						status: "COMPLETED",
						documentVersions: updatedDocumentVersions,
						latestPDFVersion: pdfVersion,
					},
				});
			} catch (error) {
				if (numberingRecord?.id) {
					await Prisma.letterNumbering.delete({ where: { id: numberingRecord.id } });
				}
				throw error;
			}

			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "NUMBERED",
					step: PKL_WORKFLOW_STEPS.UPA,
					actorUserId: user.id,
					actorRole: "upa",
					comment: null,
					metadata: {
						numberString,
						counter,
					},
				},
			});

			return {
				success: true,
				message: "Surat berhasil diberi nomor dan selesai diproses",
				data: {
					letterId: letter.id,
					numberString: numberString,
					status: "COMPLETED",
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				numberString: t.String(),
				date: t.Optional(t.String()),
			}),
		},
	);
