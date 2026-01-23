import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	// GET endpoints - Public untuk authenticated users (diperlukan untuk form pemilihan dosen)
	.get(
		"/by-prodi/:prodiId",
		async ({ params: { prodiId } }) => {
			const dosenPembimbing = await Prisma.user.findMany({
				where: {
					userRole: {
						some: {
							role: {
								name: "dosen_pembimbing",
							},
						},
					},
					pegawai: {
						programStudiId: prodiId,
					},
				},
				include: {
					pegawai: {
						include: {
							programStudi: true,
						},
					},
				},
			});

			return {
				success: true,
				data: dosenPembimbing.map((dosen) => ({
					id: dosen.id,
					name: dosen.name,
					email: dosen.email,
					nip: dosen.pegawai?.nip || null,
					programStudi: dosen.pegawai?.programStudi
						? {
								id: dosen.pegawai.programStudi.id,
								name: dosen.pegawai.programStudi.name,
								code: dosen.pegawai.programStudi.code,
							}
						: null,
				})),
			};
		},
		{
			params: t.Object({
				prodiId: t.String(),
			}),
		},
	)
	.get(
		"/koordinator-kaprodi/:prodiId",
		async ({ params: { prodiId } }) => {
			const prodiStaff = await Prisma.pegawai.findMany({
				where: {
					programStudiId: prodiId,
				},
				include: {
					user: {
						include: {
							userRole: {
								include: { role: true },
							},
						},
					},
				},
			});

			const koordinator = prodiStaff.find((p) =>
				p.user.userRole.some((ur) => ur.role.name === "dosen_koordinator"),
			);
			const kaprodi = prodiStaff.find((p) =>
				p.user.userRole.some((ur) => ur.role.name === "ketua_program_studi"),
			);

			return {
				success: true,
				data: {
					koordinator: koordinator
						? {
								id: koordinator.userId,
								name: koordinator.user.name,
								nip: koordinator.nip,
							}
						: null,
					kaprodi: kaprodi
						? {
								id: kaprodi.userId,
								name: kaprodi.user.name,
								nip: kaprodi.nip,
							}
						: null,
				},
			};
		},
		{
			params: t.Object({
				prodiId: t.String(),
			}),
		},
	);
