import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth.ts";
import { MahasiswaService } from "@backend/services/database_models/mahasiswa.service.ts";
import { UserService } from "@backend/services/database_models/user.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/all",
		async () => {
			const data = await MahasiswaService.getAll();
			return {
				success: true,
				data,
			};
		},
		{
			...requirePermission("mahasiswa", "read"),
			body: t.Object({}),
		},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			return MahasiswaService.get(id);
		},
		{
			...requirePermission("mahasiswa", "read"),
			body: t.Object({}),
		},
	)
	.post(
		"/",
		async ({
			body: {
				name,
				email,
				noHp,
				nim,
				tahunMasuk,
				alamat,
				tempatLahir,
				tanggalLahir,
				departemenId,
				programStudiId,
			},
		}) => {
			const user = await UserService.create({
				name: name,
				email: email,
			});

			const mahasiswa = await MahasiswaService.create({
				userId: user.id,
				noHp: noHp,
				nim: nim,
				tahunMasuk: tahunMasuk,
				alamat: alamat,
				tempatLahir: tempatLahir,
				tanggalLahir: tanggalLahir && tanggalLahir.trim() !== "" ? new Date(tanggalLahir) : null,
				departemenId: departemenId,
				programStudiId: programStudiId,
			});

			return {
				message: "Mahasiswa created successfully",
				mahasiswa,
			};
		},
		{
			...requirePermission("mahasiswa", "create"),
			body: t.Object({
				name: t.String(),
				email: t.String(),
				noHp: t.String(),
				nim: t.String(),
				tahunMasuk: t.String(),
				alamat: t.String(),
				tempatLahir: t.String(),
				tanggalLahir: t.String(),
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
				noHp,
				nim,
				tahunMasuk,
				alamat,
				tempatLahir,
				tanggalLahir,
				departemenId,
				programStudiId,
			},
		
		}) => {
			const updateData: any = {
				noHp,
				nim,
				tahunMasuk,
				alamat,
				tempatLahir,
				departemenId,
				programStudiId,
			};
			
			if (tanggalLahir !== undefined) {
				updateData.tanggalLahir = tanggalLahir && tanggalLahir.trim() !== "" ? new Date(tanggalLahir) : null;
			}

			const mahasiswa = await MahasiswaService.update(id, updateData);

			return {
				message: "Mahasiswa updated successfully",
				mahasiswa,
			};
		},
		{
			...requirePermission("mahasiswa", "update"),
			body: t.Object({
				id: t.String(),
				noHp: t.Optional(t.String()),
				nim: t.Optional(t.String()),
				tahunMasuk: t.Optional(t.String()),
				alamat: t.Optional(t.String()),
				tempatLahir: t.Optional(t.String()),
				tanggalLahir: t.Optional(t.String()),
				departemenId: t.Optional(t.String()),
				programStudiId: t.Optional(t.String()),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params: { id } }) => {
			await MahasiswaService.delete(id);
			return {
				message: "Mahasiswa deleted successfully",
			};
		},
		{
			...requirePermission("mahasiswa", "delete"),
			params: t.Object({
				id: t.String(),
			}),
		},
	);
