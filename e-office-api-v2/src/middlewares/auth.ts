import { Elysia } from "elysia";
import { auth } from "@backend/lib/auth";
import { checkPermission, getUserRoles } from "@backend/lib/casbin";

export interface PermissionProps {
	resource: string;
	action: string;
}

export interface RequiredRoleProps {
	requiredRole: string;
}

export const authGuardPlugin = new Elysia({
	name: "auth",
})
	.mount(auth.handler)
	.resolve(async ({ status, request }) => {
		// Better Auth getSession expects request object with headers
		// Pass the full request object, not just headers
		const headers = request.headers;
		const cookieHeader = headers.get("cookie");

		// Debug: Log all header keys and Auth header specifically
		console.log("[AUTH DEBUG] Headers received:", Array.from(headers.keys()));
		const authHeaderDebug = headers.get("authorization");
		if (authHeaderDebug) {
			console.log("[AUTH DEBUG] Authorization header:", authHeaderDebug.substring(0, 20) + "...");
		} else {
			console.log("[AUTH DEBUG] Authorization header: MISSING");
		}

		// Debug: log cookie header
		if (cookieHeader) {
			console.log("[AUTH DEBUG] Cookie header received:", cookieHeader.substring(0, 150));

			// Extract better-auth.session_token from cookie string
			const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
			if (match) {
				const token = match[1];
				console.log("[AUTH DEBUG] Extracted token:", token.substring(0, 30) + "...");

				// Verify token exists in database
				const { Prisma } = await import("@backend/db/index");
				const sessionInDb = await Prisma.session.findFirst({
					where: { token: token },
				});
				console.log("[AUTH DEBUG] Session in DB:", sessionInDb ? "Found" : "Not found");
			}
		} else {
			console.log("[AUTH DEBUG] No cookie header found");
		}

		// Better Auth getSession - try with request object first
		// Better Auth might need the full request context
		let session = null;

		try {
			// Try 1: Pass request object directly (if Better Auth supports it)
			// Better Auth getSession expects { headers: Headers }
			const requestHeaders = new Headers();
			headers.forEach((value, key) => {
				requestHeaders.set(key, value);
			});

			session = await auth.api.getSession({
				headers: requestHeaders,
			});
		} catch (error) {
			console.log("[AUTH DEBUG] Error calling getSession:", error);
		}

		if (!session) {
			console.log("[AUTH DEBUG] getSession returned null - trying alternative approach...");

			// Try 2: Use original headers (Elysia headers might work)
			try {
				session = await auth.api.getSession({
					headers: headers as HeadersInit,
				});
			} catch (error) {
				console.log("[AUTH DEBUG] Error with original headers:", error);
			}

			// Try 3: Manual session lookup from database (workaround)
			// Better Auth getSession might not read cookies correctly from Elysia headers
			// So we manually lookup session from database using cookie token
			if (!session && cookieHeader) {
				const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
				if (match) {
					const token = match[1];
					console.log("[AUTH DEBUG] Manual lookup: token found in cookie, checking database...");

					const { Prisma } = await import("@backend/db/index");
					const sessionInDb = await Prisma.session.findFirst({
						where: {
							token: token,
							expiresAt: { gt: new Date() }, // Check if not expired
						},
						include: {
							user: true,
						},
					});

					if (sessionInDb && sessionInDb.user) {
						console.log("[AUTH DEBUG] Manual lookup: session found in database for user:", sessionInDb.user.email);
						// Return session in Better Auth format
						session = {
							user: sessionInDb.user,
							session: {
								id: sessionInDb.id,
								token: sessionInDb.token,
								expiresAt: sessionInDb.expiresAt,
								userId: sessionInDb.userId,
							},
						};
					} else {
						console.log("[AUTH DEBUG] Manual lookup: session not found or expired in database");
					}
				}
			}

			// Try 4: Manual session lookup - Bearer Token
			if (!session) {
				const authHeader = headers.get("authorization");
				if (authHeader && authHeader.startsWith("Bearer ")) {
					const token = authHeader.split(" ")[1];
					console.log("[AUTH DEBUG] Manual verification: Bearer token found in header");

					const { Prisma } = await import("@backend/db/index");
					const sessionInDb = await Prisma.session.findFirst({
						where: {
							token: token,
							expiresAt: { gt: new Date() },
						},
						include: { user: true },
					});

					if (sessionInDb && sessionInDb.user) {
						console.log("[AUTH DEBUG] Manual Bearer lookup: session found for user:", sessionInDb.user.email);
						session = {
							user: sessionInDb.user,
							session: {
								id: sessionInDb.id,
								token: sessionInDb.token,
								expiresAt: sessionInDb.expiresAt,
								userId: sessionInDb.userId,
							},
						};
					} else {
						console.log("[AUTH DEBUG] Manual Bearer lookup: session not found or expired");
					}
				}
			}

			// Try 5: Query parameter token (for iframes and direct links)
			if (!session) {
				const url = new URL(request.url);
				const queryToken = url.searchParams.get("token");
				if (queryToken) {
					console.log("[AUTH DEBUG] Manual verification: token found in query param");

					const { Prisma } = await import("@backend/db/index");
					const sessionInDb = await Prisma.session.findFirst({
						where: {
							token: queryToken,
							expiresAt: { gt: new Date() },
						},
						include: { user: true },
					});

					if (sessionInDb && sessionInDb.user) {
						console.log("[AUTH DEBUG] Manual Query lookup: session found for user:", sessionInDb.user.email);
						session = {
							user: sessionInDb.user,
							session: {
								id: sessionInDb.id,
								token: sessionInDb.token,
								expiresAt: sessionInDb.expiresAt,
								userId: sessionInDb.userId,
							},
						};
					} else {
						console.log("[AUTH DEBUG] Manual Query lookup: session not found or expired");
					}
				}
			}

			if (!session) {
				console.log("[AUTH DEBUG] All attempts failed - 401 Unauthorized");
				return status(401);
			}
		}

		console.log("[AUTH DEBUG] Session found for user:", session.user?.email);

		return {
			user: session.user,
			session: session.session,
		};
	})
	.macro({
		permission: ({ resource, action }: PermissionProps) => {
			return {
				async resolve({ status, user }) {
					if (!user) {
						return status(401, {
							error: "Unauthorized",
							message: "Authentication required",
						});
					}

					const hasPermission = await checkPermission(
						user.id,
						resource,
						action,
					);

					if (!hasPermission) {
						const roles = await getUserRoles(user.id);
						return status(403, {
							error: "Forbidden",
							message: `You don't have permission to ${action} ${resource}`,
							userRoles: roles,
						});
					}

					return { user };
				},
			};
		},

		role: ({ requiredRole }: RequiredRoleProps) => {
			return {
				async resolve({ status, user }) {
					if (!user) {
						return status(401, {
							error: "Unauthorized",
							message: "Authentication required",
						});
					}

					const roles = await getUserRoles(user.id);

					if (!roles.includes(requiredRole)) {
						return status(403, {
							error: "Forbidden",
							message: `Role '${requiredRole}' required`,
							userRoles: roles,
						});
					}
					return { user };
				},
			};
		},
	})
	.as("scoped");

export const isAuthenticated = authGuardPlugin;

export const requirePermission = (resource: string, action: string) => ({
	permission: { resource, action },
});

export const requireRole = (role: string) => ({
	role: { requiredRole: role },
});
