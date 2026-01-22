// Endpoint: Get my letters (mahasiswa lihat surat miliknya)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get("/", async ({ user }) => {
		// Get semua surat yang dibuat oleh user ini
		const letters = await Prisma.letterInstance.findMany({
			where: {
				createdById: user.id,
			},
			include: {
				letterType: true,
				numbering: true,
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
