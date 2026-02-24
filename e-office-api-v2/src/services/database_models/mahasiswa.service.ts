// mahasiswa.service.ts

import { Prisma, type Mahasiswa } from "@backend/db/index";
import type { Prisma as PrismaTypes } from "@backend/generated/prisma";
type MahasiswaDelegate = PrismaTypes.MahasiswaDelegate;
type MahasiswaInclude = PrismaTypes.MahasiswaInclude;
type MahasiswaUncheckedCreateInput = PrismaTypes.MahasiswaUncheckedCreateInput;
type MahasiswaUncheckedUpdateInput = PrismaTypes.MahasiswaUncheckedUpdateInput;
import { CRUD } from "./__basicCRUD";

export abstract class MahasiswaService extends CRUD<
	Mahasiswa,
	MahasiswaDelegate,
	MahasiswaInclude
>(Prisma.mahasiswa, { user: true, departemen: true, programStudi: true }) {
	public static create(data: MahasiswaUncheckedCreateInput) {
		return Prisma.mahasiswa.create({
			data: data,
		});
	}

	public static update(id: string, data: MahasiswaUncheckedUpdateInput) {
		return Prisma.mahasiswa.update({
			where: { id: id },
			data: data,
		});
	}
}
