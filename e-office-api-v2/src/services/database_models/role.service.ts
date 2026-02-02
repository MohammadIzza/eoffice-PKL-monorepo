import { Prisma, type Role } from "@backend/db/index.ts";
import type {
	RoleDelegate,
	RoleInclude,
	RoleCreateInput,
	RoleUpdateInput
} from "@backend/generated/prisma/models.ts";
import { CRUD } from "./__basicCRUD.ts";

export abstract class RoleService extends CRUD<Role, RoleDelegate, RoleInclude>(
	Prisma.role,
) {
	public static create(data: RoleCreateInput) {
		return Prisma.role.create({ data: data });
	}

	public static update(id: string, data: RoleUpdateInput) {
		return Prisma.role.update({
			where: { id: id },
			data: data,
		})
	}
}
