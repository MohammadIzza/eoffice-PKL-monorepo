import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { Elysia } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get("/", async ({ user }) => {
		const letters = await Prisma.letterInstance.findMany({
			where: {
				createdById: user.id,
			},
			include: {
				letterType: true,
				numbering: true,
				stepHistory: {
					orderBy: {
						createdAt: "asc",
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
	});
