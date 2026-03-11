import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth";
import { DepartemenService } from "@backend/services/database_models/departemen.service";
import { Prisma } from "@backend/db/index";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	// GET /all - Public untuk authenticated users (data tidak sensitif, diperlukan untuk form)
	.get(
		"/all",
		async () => {
			const departemen = await DepartemenService.getAll();
			return {
				success: true,
				data: departemen,
			};
		},
		{},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			const data = await DepartemenService.get(id);
			return { success: true, data };
		},
		{
			...requirePermission("departemen", "read"),
			body: t.Object({}),
		},
	)
	.post(
		"/",
		async ({ body: { name, code } }) => {
			const letter = await DepartemenService.create({
				name: name,
				code: code,
			});

			return {
				message: "Departemen created successfully",
				letter,
			};
		},
		{
			...requirePermission("departemen", "create"),
			body: t.Object({
				name: t.String(),
				code: t.String(),
			}),
		},
	)
	.patch(
		"/",
		async ({ body: { id, name, code } }) => {
			const letter = await DepartemenService.update(id, {
				name: name,
				code: code,
			});

			return {
				message: "Departemen update successfully",
				letter,
			};
		},
		{
			...requirePermission("departemen", "update"),
			body: t.Object({
				id: t.String(),
				name: t.String(),
				code: t.String(),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params: { id } }) => {
			// Check if any related data exists
			const prodiCount = await Prisma.programStudi.count({ where: { departemenId: id } });
			if (prodiCount > 0) {
				throw new Error(`Departemen tidak dapat dihapus karena masih memiliki ${prodiCount} Program Studi. Hapus atau pindahkan Program Studi terlebih dahulu.`);
			}
			const mahasiswaCount = await Prisma.mahasiswa.count({ where: { departemenId: id } });
			if (mahasiswaCount > 0) {
				throw new Error(`Departemen tidak dapat dihapus karena direferensikan oleh ${mahasiswaCount} data Mahasiswa.`);
			}
			const pegawaiCount = await Prisma.pegawai.count({ where: { departemenId: id } });
			if (pegawaiCount > 0) {
				throw new Error(`Departemen tidak dapat dihapus karena direferensikan oleh ${pegawaiCount} data Pegawai.`);
			}
			await DepartemenService.delete(id);
			return {
				message: "Departemen deleted successfully",
			};
		},
		{
			...requirePermission("departemen", "delete"),
			params: t.Object({
				id: t.String(),
			}),
		},
	);
