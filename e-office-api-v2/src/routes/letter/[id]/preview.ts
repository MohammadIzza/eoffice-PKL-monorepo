import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { MinioService } from "@backend/services/minio.service.ts";
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
				},
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			const isCreator = letter.createdById === user.id;
			const userRoles = await Prisma.userRole.findMany({
				where: { userId: user.id },
				include: { role: true },
			});
			const userRoleNames = userRoles.map((ur) => ur.role.name);

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

			if (!documentVersions || documentVersions.length === 0) {
				return {
					success: true,
					message: "Belum ada dokumen yang tersedia",
					data: {
						letterId: letter.id,
						preview: null,
						message: "Dokumen belum di-generate. Silakan tunggu proses approval.",
					},
				};
			}

			// Prioritas: PDF terbaru > Editable terbaru
			const latestPDF = documentVersions
				.filter((v) => v.isPDF)
				.sort((a, b) => b.version - a.version)[0];

			const latestEditable = documentVersions
				.filter((v) => v.isEditable)
				.sort((a, b) => b.version - a.version)[0];

			const latestVersion = latestPDF || latestEditable || documentVersions[documentVersions.length - 1];

			if (!latestVersion.storageKey) {
				return {
					success: true,
					message: "Dokumen belum tersedia",
					data: {
						letterId: letter.id,
						preview: null,
						message: "Dokumen belum di-generate.",
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
