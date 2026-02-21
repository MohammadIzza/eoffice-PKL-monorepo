// permission.service.ts

import { Prisma, type Permission } from "@backend/db/index";
import type { Prisma as PrismaTypes } from "@backend/generated/prisma";
type PermissionDelegate = PrismaTypes.PermissionDelegate;
type PermissionInclude = PrismaTypes.PermissionInclude;
import { CRUD } from "./__basicCRUD";

export abstract class PermissionService extends CRUD<
	Permission,
	PermissionDelegate,
	PermissionInclude
>(Prisma.permission) { }
