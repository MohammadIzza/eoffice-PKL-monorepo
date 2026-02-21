import { auth } from "@backend/lib/auth";
import { Elysia } from "elysia";

export default new Elysia().post(
	"/",
	async ({ headers, set }) => {
		const data = await auth.api.signOut({
			headers: headers as HeadersInit,
		});

		// Clear cookie by setting it to expire immediately
		const cookieName = "better-auth.session_token";
		set.headers["Set-Cookie"] = `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Secure=false; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

		return {
			success: true,
			message: "Logout berhasil",
			data,
		};
	},
	{},
);
