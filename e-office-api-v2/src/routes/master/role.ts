import { authGuardPlugin, requirePermission } from "@backend/middlewares/auth.ts";
import { RoleService } from "@backend/services/database_models/role.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/all",
		async () => {
			const data = await RoleService.getAll();
			return {
				success: true,
				data,
			};
		},
		{
			...requirePermission("role", "read"),
			body: t.Object({}),
		},
	)
	.get(
		"/:id",
		async ({ params: { id } }) => {
			const data = await RoleService.get(id);
			return {
				success: true,
				data,
			};
		},
		{
			...requirePermission("role", "read"),
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		"/",
		async ({ body: { name } }) => {
			const role = await RoleService.create({
				name: name,
			});

			return {
				message: "Role created successfully",
				role,
			};
		},
		{
			...requirePermission("role", "create"),
			body: t.Object({
				name: t.String(),
			}),
		},
	)
	.patch(
		"/",
		async ({ body: { id, name } }) => {
			const role = await RoleService.update(id, {
				name: name,
			});

			return {
				message: "Role update successfully",
				role,
			};
		},
		{
			...requirePermission("role", "update"),
			body: t.Object({
				id: t.String(),
				name: t.String(),
			}),
		},
	)
	.delete(
		"/:id",
		async ({ params: { id } }) => {
			await RoleService.delete(id);
			return {
				message: "Role deleted successfully",
			};
		},
		{
			...requirePermission("role", "delete"),
			params: t.Object({
				id: t.String(),
			}),
		},
	);
