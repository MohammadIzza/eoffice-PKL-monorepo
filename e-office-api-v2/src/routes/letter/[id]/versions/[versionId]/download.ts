import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { MinioService } from "@backend/services/minio.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async ({ params: { id, versionId }, user }) => {
			const version = parseInt(versionId);

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
					throw new Error("Anda tidak berhak mengunduh dokumen ini");
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
				throw new Error("Dokumen tidak ditemukan");
			}

			const targetVersion = documentVersions.find((v) => v.version === version);

			if (!targetVersion) {
				throw new Error(`Versi ${version} tidak ditemukan`);
			}

			if (!targetVersion.storageKey) {
				throw new Error("Dokumen versi ini belum tersedia");
			}

			const downloadUrl = await MinioService.getPresignedUrl(
				"",
				targetVersion.storageKey,
				1 * 60 * 60,
			);

			return {
				success: true,
				message: "Download URL berhasil di-generate",
				data: {
					letterId: letter.id,
					version: targetVersion.version,
					format: targetVersion.format,
					isPDF: targetVersion.isPDF,
					isEditable: targetVersion.isEditable,
					createdBy: targetVersion.createdBy,
					reason: targetVersion.reason,
					timestamp: targetVersion.timestamp,
					downloadUrl: downloadUrl,
					expiresIn: 3600,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
				versionId: t.String(),
			}),
		},
	);
