import { auth } from "@backend/lib/auth.ts";
import { Elysia } from "elysia";

export default new Elysia().post(
	"/",
	async ({ headers }) => {
		const data = await auth.api.signOut({
			headers: headers,
		});

		return {
			success: true,
			message: "Logout berhasil",
			data,
		};
	},
	{},
);
