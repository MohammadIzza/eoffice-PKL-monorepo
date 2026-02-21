import { Prisma, type Role } from "@backend/db/index";
import type { Prisma as PrismaTypes } from "@backend/generated/prisma";
type RoleDelegate = PrismaTypes.RoleDelegate;
type RoleInclude = PrismaTypes.RoleInclude;
type RoleCreateInput = PrismaTypes.RoleCreateInput;
type RoleUpdateInput = PrismaTypes.RoleUpdateInput;
import { CRUD } from "./__basicCRUD";

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
