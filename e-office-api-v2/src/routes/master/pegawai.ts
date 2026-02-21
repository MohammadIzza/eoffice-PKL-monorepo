import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth";
import { PegawaiService } from "@backend/services/database_models/pegawai.service";
import { UserService } from "@backend/services/database_models/user.service";
import { Prisma } from "@backend/db/index";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/all",
		async () => {
			const data = await PegawaiService.getAll();
			return {
				success: true,
				data,
			};
		},
		{
			...requirePermission("pegawai", "read"),
			body: t.Object({}),
		},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			const data = await PegawaiService.get(id);
			return {
				success: true,
				data,
			};
		},
		{
			...requirePermission("pegawai", "read"),
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		"/",
		async ({
			body: {
				name,
				email,
				nip,
				jabatan,
				noHp,
				departemenId,
				programStudiId,
			},
		}) => {
			let user = await Prisma.user.findUnique({
				where: { email: email },
			});

			let userAlreadyExists = false;
			if (!user) {
				user = await UserService.create({
					name: name,
					email: email,
				});
			} else {
				userAlreadyExists = true;
			}

			const existingPegawai = await Prisma.pegawai.findFirst({
				where: { userId: user.id }
			});

			if (existingPegawai) {
				throw new Error(`Pegawai dengan email ${email} sudah terdaftar.`);
			}		

			const pegawai = await PegawaiService.create({
				user: { connect: { id: user.id } },
				nip: nip,
				jabatan: jabatan,
				noHp: noHp,
				departemen: { connect: { id: departemenId } },
				programStudi: { connect: { id: programStudiId } },
			});

			return {
				message: userAlreadyExists 
					? "Pegawai created successfully. Catatan: Akun dengan email ini sudah terdaftar di User."
					: "Pegawai created successfully. Catatan: Akun User baru telah dibuat otomatis.",
				pegawai,
			};
		},
		{
			...requirePermission("pegawai", "create"),
			body: t.Object({
				name: t.String(),
				email: t.String(),
				nip: t.String(),
				jabatan: t.String(),
				noHp: t.Optional(t.String()),
				departemenId: t.String(),
				programStudiId: t.String(),
			}),
		},
	)
	.patch(
		"/",
		async ({
			body: {
				id,
				nip,
				jabatan,
				noHp,
				departemenId,
				programStudiId,
			},
		}) => {
			const updateData: any = {};
			if (nip) updateData.nip = nip;
			if (jabatan) updateData.jabatan = jabatan;
			if (noHp !== undefined) updateData.noHp = noHp;
			if (departemenId) updateData.departemen = { connect: { id: departemenId } };
			if (programStudiId) updateData.programStudi = { connect: { id: programStudiId } };

			const pegawai = await PegawaiService.update(id, updateData);

			return {
				message: "Pegawai update successfully",
				pegawai,
			};
		},
		{
			...requirePermission("pegawai", "update"),
			body: t.Object({
				id: t.String(),
				nip: t.Optional(t.String()),
				jabatan: t.Optional(t.String()),
				noHp: t.Optional(t.String()),
				departemenId: t.Optional(t.String()),
				programStudiId: t.Optional(t.String()),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params: { id } }) => {
			await PegawaiService.delete(id);
			return {
				message: "Pegawai deleted successfully",
			};
		},
		{
			...requirePermission("pegawai", "delete"),
			params: t.Object({
				id: t.String(),
			}),
		},
	);
