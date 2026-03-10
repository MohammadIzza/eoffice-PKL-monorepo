import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth";
import { UserService } from "@backend/services/database_models/user.service";
import { Prisma } from "@backend/db/index";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/all",
		async () => {
			const users = await Prisma.user.findMany({
				include: {
					userRole: {
						include: { role: true },
					},
				},
				orderBy: { name: 'asc' },
			});
			return { success: true, data: users };
		},
		{
			...requirePermission("user", "read"),
		},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			const user = await Prisma.user.findUnique({
				where: { id },
				include: { userRole: { include: { role: true } } },
			});
			return { success: true, data: user };
		},
		{
			...requirePermission("user", "read"),
		},
	)
	.post(
		"/",
		async ({ body: { name, email, roleId } }) => {
			const letter = await UserService.create({
				name: name,
				email: email,
				isAnonymous: false,
			});

			if (roleId) {
				await Prisma.userRole.create({
					data: { userId: letter.id, roleId },
				});
			}

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
				roleId: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/",
		async ({ body: { id, name, roleId } }) => {
			const letter = await UserService.update(id, {
				name: name,
			});

			if (roleId !== undefined) {
				// Replace existing role
				await Prisma.userRole.deleteMany({ where: { userId: id } });
				if (roleId) {
					await Prisma.userRole.create({
						data: { userId: id, roleId },
					});
				}
			}

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
				roleId: t.Optional(t.String()),
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
