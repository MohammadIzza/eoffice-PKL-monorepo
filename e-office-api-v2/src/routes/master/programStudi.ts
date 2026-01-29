import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth.ts";
import { ProgramStudiService } from "@backend/services/database_models/programStudi.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	// GET /all - Public untuk authenticated users (data tidak sensitif, diperlukan untuk form)
	.get(
		"/all",
		async () => {
			const programStudi = await ProgramStudiService.getAll();
			return {
				success: true,
				data: programStudi,
			};
		},
		{},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			const programStudi = await ProgramStudiService.get(id);
			return {
				success: true,
				data: programStudi,
			};
		},
		{
			...requirePermission("prodi", "read"),
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		"/",
		async ({ body: { name, code, departemenId } }) => {
			const programStudi = await ProgramStudiService.create({
				name: name,
				code: code,
				departemen: { connect: { id: departemenId } },
			});

			return {
				message: "Program Studi created successfully",
				programStudi,
			};
		},
		{
			...requirePermission("prodi", "create"),
			body: t.Object({
				name: t.String(),
				code: t.String(),
				departemenId: t.String(),
			}),
		},
	)
	.patch(
		"/",
		async ({ body: { id, name, code, departemenId } }) => {
			const updateData: any = {};
			if (name) updateData.name = name;
			if (code) updateData.code = code;
			if (departemenId) updateData.departemen = { connect: { id: departemenId } };

			const programStudi = await ProgramStudiService.update(id, updateData);

			return {
				message: "Program Studi update successfully",
				programStudi,
			};
		},
		{
			...requirePermission("prodi", "update"),
			body: t.Object({
				id: t.String(),
				name: t.Optional(t.String()),
				code: t.Optional(t.String()),
				departemenId: t.Optional(t.String()),
			}),
		},
	);
