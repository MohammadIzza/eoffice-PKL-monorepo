// programstudi.service.ts

import { Prisma, type ProgramStudi } from "@backend/db/index";
import type { Prisma as PrismaTypes } from "@backend/generated/prisma";
type ProgramStudiCreateArgs = PrismaTypes.ProgramStudiCreateArgs;
type ProgramStudiCreateInput = PrismaTypes.ProgramStudiCreateInput;
type ProgramStudiDelegate = PrismaTypes.ProgramStudiDelegate;
type ProgramStudiInclude = PrismaTypes.ProgramStudiInclude;
type ProgramStudiUpdateInput = PrismaTypes.ProgramStudiUpdateInput;
import { CRUD } from "./__basicCRUD";

export abstract class ProgramStudiService extends CRUD<
	ProgramStudi,
	ProgramStudiDelegate,
	ProgramStudiInclude
>(Prisma.programStudi, { departemen: true }) {
	public static create(data: ProgramStudiCreateInput) {
		return Prisma.programStudi.create({ data: data });
	}

	public static update(id: string, data: ProgramStudiUpdateInput) {
		return Prisma.programStudi.update({
			where: { id: id },
			data: data,
		});
	}
}
