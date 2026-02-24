// pegawai.service.ts

import { Prisma, type Pegawai } from "@backend/db/index";
import type { Prisma as PrismaTypes } from "@backend/generated/prisma";
type PegawaiDelegate = PrismaTypes.PegawaiDelegate;
type PegawaiInclude = PrismaTypes.PegawaiInclude;
type PegawaiCreateInput = PrismaTypes.PegawaiCreateInput;
type PegawaiUpdateInput = PrismaTypes.PegawaiUpdateInput;
type PegawaiUncheckedCreateInput = PrismaTypes.PegawaiUncheckedCreateInput;
type PegawaiUncheckedUpdateInput = PrismaTypes.PegawaiUncheckedUpdateInput;
import { CRUD } from "./__basicCRUD";

export abstract class PegawaiService extends CRUD<
	Pegawai,
	PegawaiDelegate,
	PegawaiInclude
>(Prisma.pegawai, { user: true, departemen: true, programStudi: true }) {
	public static create(data: PegawaiCreateInput | PegawaiUncheckedCreateInput) {
		return Prisma.pegawai.create({
			data: data as any,
		});
	}

	public static update(id: string, data: PegawaiUpdateInput | PegawaiUncheckedUpdateInput) {
		return Prisma.pegawai.update({
			where: { id: id },
			data: data as any,
		});
	}
}
