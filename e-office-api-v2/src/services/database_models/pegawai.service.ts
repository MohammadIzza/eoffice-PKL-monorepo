// pegawai.service.ts

import { Prisma, type Pegawai } from "@backend/db/index.ts";
import type {
	PegawaiDelegate,
	PegawaiInclude,
	PegawaiCreateInput,
	PegawaiUpdateInput,
	PegawaiUncheckedCreateInput,
	PegawaiUncheckedUpdateInput,
} from "@backend/generated/prisma/models.ts";
import { CRUD } from "./__basicCRUD.ts";

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
			where: { id: id},
			data: data as any,
		});
	}
}
