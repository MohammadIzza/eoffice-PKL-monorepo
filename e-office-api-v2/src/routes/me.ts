import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia } from "elysia";

export default new Elysia().use(authGuardPlugin).get(
	"/",
	async ({ user }) => {
		const userWithRelations = await Prisma.user.findUnique({
			where: { id: user.id },
			include: {
				userRole: {
					include: {
						role: true,
					},
				},
				mahasiswa: {
					include: {
						programStudi: true,
						departemen: true,
					},
				},
				pegawai: {
					include: {
						programStudi: true,
						departemen: true,
					},
				},
			},
		});

		if (!userWithRelations) {
			return { error: "User not found" };
		}

		return {
			id: userWithRelations.id,
			name: userWithRelations.name,
			email: userWithRelations.email,
			emailVerified: userWithRelations.emailVerified,
			image: userWithRelations.image,
			roles: userWithRelations.userRole.map((ur) => ({
				id: ur.role.id,
				name: ur.role.name,
			})),
			mahasiswa: userWithRelations.mahasiswa
				? {
						id: userWithRelations.mahasiswa.id,
						nim: userWithRelations.mahasiswa.nim,
						tahunMasuk: userWithRelations.mahasiswa.tahunMasuk,
						noHp: userWithRelations.mahasiswa.noHp,
						alamat: userWithRelations.mahasiswa.alamat,
						tempatLahir: userWithRelations.mahasiswa.tempatLahir,
						tanggalLahir: userWithRelations.mahasiswa.tanggalLahir,
						programStudi: userWithRelations.mahasiswa.programStudi
							? {
									id: userWithRelations.mahasiswa.programStudi.id,
									name: userWithRelations.mahasiswa.programStudi.name,
									code: userWithRelations.mahasiswa.programStudi.code,
								}
							: null,
						departemen: userWithRelations.mahasiswa.departemen
							? {
									id: userWithRelations.mahasiswa.departemen.id,
									name: userWithRelations.mahasiswa.departemen.name,
									code: userWithRelations.mahasiswa.departemen.code,
								}
							: null,
					}
				: null,
			pegawai: userWithRelations.pegawai
				? {
						id: userWithRelations.pegawai.id,
						nip: userWithRelations.pegawai.nip,
						jabatan: userWithRelations.pegawai.jabatan,
						noHp: userWithRelations.pegawai.noHp,
						programStudi: userWithRelations.pegawai.programStudi
							? {
									id: userWithRelations.pegawai.programStudi.id,
									name: userWithRelations.pegawai.programStudi.name,
									code: userWithRelations.pegawai.programStudi.code,
								}
							: null,
						departemen: userWithRelations.pegawai.departemen
							? {
									id: userWithRelations.pegawai.departemen.id,
									name: userWithRelations.pegawai.departemen.name,
									code: userWithRelations.pegawai.departemen.code,
								}
							: null,
					}
				: null,
		};
	},
	{},
);
