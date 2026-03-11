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
		const headers = request.headers;
		const cookieHeader = headers.get("cookie");

		let session = null;

		// Try 1: Better Auth getSession via request headers
		try {
			const requestHeaders = new Headers();
			headers.forEach((value, key) => {
				requestHeaders.set(key, value);
			});
			session = await auth.api.getSession({ headers: requestHeaders });
		} catch (_) {
			// fallthrough to manual lookup
		}

		if (!session) {
			// Try 2: Better Auth with original headers
			try {
				session = await auth.api.getSession({ headers: headers as HeadersInit });
			} catch (_) {
				// fallthrough
			}

			// Try 3: Manual cookie session lookup
			if (!session && cookieHeader) {
				const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
				if (match) {
					const token = match[1];
					const { Prisma } = await import("@backend/db/index");
					const sessionInDb = await Prisma.session.findFirst({
						where: { token, expiresAt: { gt: new Date() } },
						include: { user: true },
					});
					if (sessionInDb?.user) {
						session = {
							user: sessionInDb.user,
							session: { id: sessionInDb.id, token: sessionInDb.token, expiresAt: sessionInDb.expiresAt, userId: sessionInDb.userId },
						};
					}
				}
			}

			// Try 4: Bearer token lookup
			if (!session) {
				const authHeader = headers.get("authorization");
				if (authHeader?.startsWith("Bearer ")) {
					const token = authHeader.split(" ")[1];
					const { Prisma } = await import("@backend/db/index");
					const sessionInDb = await Prisma.session.findFirst({
						where: { token, expiresAt: { gt: new Date() } },
						include: { user: true },
					});
					if (sessionInDb?.user) {
						session = {
							user: sessionInDb.user,
							session: { id: sessionInDb.id, token: sessionInDb.token, expiresAt: sessionInDb.expiresAt, userId: sessionInDb.userId },
						};
					}
				}
			}

			// Try 5: Query parameter token (for iframes and direct links)
			if (!session) {
				const url = new URL(request.url);
				const queryToken = url.searchParams.get("token");
				if (queryToken) {
					const { Prisma } = await import("@backend/db/index");
					const sessionInDb = await Prisma.session.findFirst({
						where: { token: queryToken, expiresAt: { gt: new Date() } },
						include: { user: true },
					});
					if (sessionInDb?.user) {
						session = {
							user: sessionInDb.user,
							session: { id: sessionInDb.id, token: sessionInDb.token, expiresAt: sessionInDb.expiresAt, userId: sessionInDb.userId },
						};
					}
				}
			}

			if (!session) {
				return status(401);
			}
		}

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
