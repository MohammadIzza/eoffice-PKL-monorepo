import { auth } from "@backend/lib/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import { Elysia, t } from "elysia";

export default new Elysia().post(
	"/",
	async ({ body, headers, set, request }) => {
		// Call Better Auth signInEmail API
		// Better Auth returns data directly
		const data = await auth.api.signInEmail({
			body: {
				email: body.username, // required
				password: body.password, // required
				rememberMe: true,
			},
			headers: headers,
		});

		// Better Auth creates session in database but doesn't set cookie via API call
		// We need to manually set cookie from session token in database
		if (data.user?.id) {
			// Get the latest session for this user (just created by signInEmail)
			const session = await Prisma.session.findFirst({
				where: { userId: data.user.id },
				orderBy: { createdAt: "desc" },
			});

			if (session?.token) {
				// Better Auth default cookie name based on basePath
				// basePath: "/api/auth" -> cookie name: "api.auth.session_token"
				// But Better Auth might use default "better-auth.session_token"
				// Try both formats
				const expiresAt = new Date(session.expiresAt);
				const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
				
				// Use cookie name based on basePath
				// Better Auth uses basePath to determine cookie name
				// If basePath="/api/auth", cookie might be "api.auth.session_token"
				// But default is "better-auth.session_token"
				const cookieName = "better-auth.session_token";
				
				// Set cookie with proper attributes
				set.headers["Set-Cookie"] = `${cookieName}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Secure=false; Max-Age=${maxAge > 0 ? maxAge : 31536000}`;
			} else if (data.token) {
				// Fallback: use token from response if session not found
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
