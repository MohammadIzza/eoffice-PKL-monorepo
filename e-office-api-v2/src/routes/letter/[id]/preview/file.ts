import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { MinioService } from "@backend/services/minio.service";
import { DocumentService } from "@backend/services/document.service";
import { getUserRoles } from "@backend/lib/casbin";
import { Elysia, t } from "elysia";

export default new Elysia()
    .use(authGuardPlugin)
    .get(
        "/",
        async ({ params: { id }, query, user }) => {
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

            // Check if user is superadmin - superadmin can view all letter previews
            const userRoles = await getUserRoles(user.id);
            const isSuperAdmin = userRoles.includes("superadmin");

            if (!isSuperAdmin) {
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

            // Determine target version
            type DocumentVersion = {
                version: number;
                storageKey: string | null;
                format: string;
                createdBy: string;
                reason: string;
                timestamp: string;
                isPDF: boolean;
                isEditable: boolean;
            };

            let targetVersion: DocumentVersion | undefined;
            const requestedVersion = query.version ? parseInt(query.version) : undefined;

            if (requestedVersion && documentVersions) {
                const versions = documentVersions.filter(v => v.version === requestedVersion);
                targetVersion = versions.find(v => v.isPDF && v.storageKey) || versions.find(v => v.storageKey) || versions[0];
            }

            // If no specific version requested, find latest (PDF preferred)
            if (!targetVersion && documentVersions) {
                const latestPDF = documentVersions
                    .filter((v) => v.isPDF && v.storageKey)
                    .sort((a, b) => b.version - a.version)[0];

                const latestEditable = documentVersions
                    .filter((v) => v.isEditable && v.storageKey)
                    .sort((a, b) => b.version - a.version)[0];

                // If query.version was NOT provided, prioritizing PDF if available, else Latest Editable
                targetVersion = latestPDF || latestEditable || documentVersions.find(v => v.storageKey);
            }

            // If still no version found with storageKey, or if explicitly requested overrides (e.g. previewNumber),
            // and we didn't find a stored file, we might need to generate on-the-fly HTML.
            // BUT this endpoint is for STREAMING a file. If we need to generate HTML, we should probably return it as a stream of text/html.

            if (!targetVersion || !targetVersion.storageKey) {
                // Fallback: Generate HTML on-the-fly and stream it
                const overrides = query.previewNumber
                    ? { numberString: query.previewNumber }
                    : undefined;

                const html = await DocumentService.generateHTML(letter, overrides);
                return new Response(html, {
                    headers: {
                        "Content-Type": "text/html",
                    }
                });
            }

            try {
                const { stat, stream } = await MinioService.getFileStream(targetVersion.storageKey);

                return new Response(stream as any, {
                    headers: {
                        "Content-Type": stat.metaData["content-type"] || (targetVersion.isPDF ? "application/pdf" : "text/html"),
                        "Content-Disposition": `inline; filename="document_v${targetVersion.version}.${targetVersion.format.toLowerCase()}"`,
                        "Content-Length": stat.size.toString(),
                    },
                });
            } catch (error) {
                console.error("Error streaming file:", error);
                // Fallback to generated HTML if MinIO fails?
                const html = await DocumentService.generateHTML(letter);
                return new Response(html, {
                    headers: { "Content-Type": "text/html" }
                });
            }
        },
        {
            params: t.Object({
                id: t.String(),
            }),
            query: t.Object({
                version: t.Optional(t.String()),
                previewNumber: t.Optional(t.String()),
            }),
        },
    );
