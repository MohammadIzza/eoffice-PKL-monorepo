import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import { Prisma } from "@backend/db/index";
import env from "env-var";

export default new Elysia().get(
    "/sso",
    async ({ request, set }) => {
        // 1. Extract Authorization Header
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            set.status = 400;
            return { message: "Authorization header missing" };
        }
        const ssoToken = authHeader.split(" ")[1];

        try {
            // 2 & 3. Fetch from External SSO Host
            const ssoHost = env.get("SSO_HOST").required().asString();
            const ssoResponse = await fetch(`${ssoHost}/users/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${ssoToken}`,
                },
            });

            if (!ssoResponse.ok) {
                set.status = 401;
                return { message: "Invalid SSO token" };
            }

            const ssoData = await ssoResponse.json();
            const userEmail = ssoData?.data?.username;

            if (!userEmail || typeof userEmail !== "string") {
                set.status = 401;
                return { message: "Invalid SSO token payload format" };
            }

            // 4. Local Database Search
            const user = await Prisma.user.findFirst({
                where: { email: userEmail },
                include: {
                    userRole: {
                        include: { role: true },
                    },
                },
            });

            // 5. Strict Authorization
            if (!user) {
                set.status = 404;
                return { message: "User is not registered in the system" };
            }

            // 6. Update lastLoginAt
            await Prisma.user.update({
                where: { id: user.id },
                data: { updatedAt: new Date() }, // Assuming lastLoginAt doesn't exist, updating updatedAt
            });

            // 7. Generate Local JWT
            const rolesArray = user.userRole.map((ur) => ur.role.name);
            const jwtSecret = env.get("JWT_SECRET").required().asString();

            const localToken = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    roles: rolesArray,
                },
                jwtSecret,
                { expiresIn: "7d" }
            );

            // 8. (Optional) Session history skipped as instructed by "if exists", system currently relies on DB roles and Bearer

            // 9. Final Output (Static JSON Redirect Hook)
            const frontendUrl = env.get("FRONTEND_URL").required().asString();

            // DO NOT wrap returning in JSON {} or the frontend callback will fail redirection expectation
            return {
                success: true,
                callback_url: `${frontendUrl}/sso/callback?token=${localToken}`,
            };
        } catch (error) {
            console.error("SSO Bridge Error:", error);
            set.status = 500;
            return { message: "Internal server error during SSO processing" };
        }
    }
);
