import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth.ts";
import { UserService } from "@backend/services/database_models/user.service.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/all",
		async () => {
			return UserService.getAll();
		},
		{
			...requirePermission("user", "read"),
			body: t.Object({}),
		},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			return UserService.get(id);
		},
		{
			...requirePermission("user", "read"),
			body: t.Object({}),
		},
	)
	.post(
		"/",
		async ({ body: { name, email } }) => {
			const letter = await UserService.create({
				name: name,
				email: email,
				isAnonymous: false,
			});

			return {
				message: "User created successfully",
				letter,
			};
		},
		{
			...requirePermission("user", "create"),
			body: t.Object({
				name: t.String(),
				email: t.String(),
			}),
		},
	)
	.patch(
		"/",
		async ({ body: { id, name } }) => {
			const letter = await UserService.update(id, {
				name: name,
			});

			return {
				message: "User update successfully",
				letter,
			};
		},
		{
			...requirePermission("user", "update"),
			body: t.Object({
				id: t.String(),
				name: t.Optional(t.String()),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params: { id } }) => {
			// Check for related Mahasiswa and Pegawai entries
			const mahasiswa = await Prisma.mahasiswa.findFirst({
				where: { userId: id }
			});
			const pegawai = await Prisma.pegawai.findFirst({
				where: { userId: id }
			});

			let warning = "";
			if (mahasiswa && pegawai) {
				warning = "Catatan: Entri Mahasiswa dan Pegawai yang terikat pada akun ini juga akan dihapus.";
			} else if (mahasiswa) {
				warning = "Catatan: Entri Mahasiswa yang terikat pada akun ini juga akan dihapus.";
			} else if (pegawai) {
				warning = "Catatan: Entri Pegawai yang terikat pada akun ini juga akan dihapus.";
			}

			await UserService.delete(id);
			return {
				message: "User deleted successfully",
				warning: warning || undefined,
			};
		},
		{
			...requirePermission("user", "delete"),
			params: t.Object({
				id: t.String(),
			}),
		},
	);
