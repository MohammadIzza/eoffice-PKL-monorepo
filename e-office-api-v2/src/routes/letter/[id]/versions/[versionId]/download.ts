import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { MinioService } from "@backend/services/minio.service";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async ({ params: { id, versionId }, user, session, request }) => {
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

			const versions = documentVersions.filter((v) => v.version === version);
			const targetVersion = versions.find(v => v.isPDF && v.storageKey) || versions.find(v => v.storageKey) || versions[0];

			if (!targetVersion) {
				throw new Error(`Versi ${version} tidak ditemukan`);
			}

			if (!targetVersion.storageKey) {
				throw new Error("Dokumen versi ini belum tersedia");
			}

			const origin = new URL(request.url).origin;
			const downloadUrl = `${origin}/letter/${letter.id}/preview/file?version=${targetVersion.version}${session?.token ? `&token=${session.token}` : ''}`;

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
