import { auth } from "@backend/lib/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia().post(
	"/",
	async ({ body, headers, set, request }) => {
		const data = await auth.api.signInEmail({
			body: {
				email: body.username,
				password: body.password,
				rememberMe: true,
			},
			headers: headers,
		});

		if (data.user?.id) {
			const session = await Prisma.session.findFirst({
				where: { userId: data.user.id },
				orderBy: { createdAt: "desc" },
			});

			if (session?.token) {
				const expiresAt = new Date(session.expiresAt);
				const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
				const cookieName = "better-auth.session_token";
				set.headers["Set-Cookie"] = `${cookieName}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Secure=false; Max-Age=${maxAge > 0 ? maxAge : 31536000}`;
			} else if (data.token) {
				const cookieName = "better-auth.session_token";
				set.headers["Set-Cookie"] = `${cookieName}=${data.token}; Path=/; HttpOnly; SameSite=Lax; Secure=false; Max-Age=31536000`;
			}
		}

		return data;
	},
	{
		body: t.Object({
			username: t.String(),
			password: t.String(),
		}),
	},
);
