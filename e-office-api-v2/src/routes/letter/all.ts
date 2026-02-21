import { authGuardPlugin, requireRole } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { Elysia } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/",
		async () => {
			const letters = await Prisma.letterInstance.findMany({
				include: {
					letterType: true,
					numbering: true,
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							mahasiswa: {
								select: {
									nim: true,
									departemen: {
										select: {
											name: true,
											code: true,
										},
									},
									programStudi: {
										select: {
											name: true,
											code: true,
										},
									},
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return {
				success: true,
				data: letters,
			};
		},
		{
			...requireRole("superadmin"),
		},
	);
