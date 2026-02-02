import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia().get(
	"/",
	async ({ params: { id }, error }) => {
		const letter = await Prisma.letterInstance.findUnique({
			where: { id },
			select: {
				id: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				signedAt: true,
				signatureUrl: true,
				letterType: {
					select: {
						name: true,
					},
				},
				createdBy: {
					select: {
						name: true,
						email: true,
					},
				},
				numbering: {
					select: {
						numberString: true,
						date: true,
					},
				},
				stepHistory: {
					orderBy: {
						createdAt: "asc",
					},
					select: {
						id: true,
						action: true,
						step: true,
						actorRole: true,
						comment: true,
						createdAt: true,
						actor: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!letter) {
			return error(404, "Surat tidak ditemukan");
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
