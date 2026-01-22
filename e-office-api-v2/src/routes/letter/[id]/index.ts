import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
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
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					stepHistory: {
						include: {
							actor: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
						orderBy: {
							createdAt: "asc",
						},
					},
					attachments: {
						where: {
							isActive: true,
						},
					},
					numbering: true,
				},
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			return {
				success: true,
				data: letter,
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);
