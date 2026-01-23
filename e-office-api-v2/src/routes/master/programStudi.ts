import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { ProgramStudiService } from "@backend/services/database_models/programStudi.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	// GET /all dan GET /:id - Public untuk authenticated users (data tidak sensitif, diperlukan untuk form)
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
			params: t.Object({
				id: t.String(),
			}),
		},
	);
