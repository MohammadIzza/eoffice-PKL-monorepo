import { type LetterType, Prisma } from "@backend/db/index";
import { CRUD } from "./__basicCRUD";
import type { Prisma as PrismaTypes } from "@backend/generated/prisma";
type LetterTypeInclude = PrismaTypes.LetterTypeInclude;
type LetterTypeDelegate = PrismaTypes.LetterTypeDelegate;
type LetterTypeCreateInput = PrismaTypes.LetterTypeCreateInput;
type LetterTypeUpdateInput = PrismaTypes.LetterTypeUpdateInput;

export abstract class LetterTypeService extends CRUD<
	LetterType,
	LetterTypeDelegate,
	LetterTypeInclude
>(Prisma.letterType) {
	public static async getAllLetterVersion(id: string) {
		const letterTemplates = await LetterTypeService.get(id, {
			include: {
				templates: true,
			},
		});

		return letterTemplates;
	}

	public static create(data: LetterTypeCreateInput) {
		return Prisma.letterType.create({ data: data });
	}

	public static update(id: string, data: LetterTypeUpdateInput) {
		return Prisma.letterType.update({
			where: { id: id },
			data: data,
		});
	}
}
