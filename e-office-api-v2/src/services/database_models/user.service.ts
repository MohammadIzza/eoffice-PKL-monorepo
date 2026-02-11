import { Prisma, type User } from "@backend/db/index.ts";
import { CRUD } from "./__basicCRUD.ts";
import type {
	UserCreateInput,
	UserDelegate,
	UserInclude,
	UserUpdateInput,
} from "@backend/generated/prisma/models.ts";

export abstract class UserService extends CRUD<User, UserDelegate, UserInclude>(
	Prisma.user,
) {
	public static create(data: UserCreateInput) {
		return Prisma.user.create({ data: data });
	}

	public static update(id: string, data: UserUpdateInput) {
		return Prisma.user.update({
			where: { id: id },
			data: data,
		});
	}

	public static async delete(id: string): Promise<User> {
		// Delete related Mahasiswa and Pegawai entries (cascade)
		await Prisma.mahasiswa.deleteMany({
			where: { userId: id }
		});
		await Prisma.pegawai.deleteMany({
			where: { userId: id }
		});
		// Then delete the User
		return await Prisma.user.delete({
			where: { id: id }
		});
	}
}
