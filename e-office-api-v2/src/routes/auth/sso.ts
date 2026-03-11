import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { Prisma } from "@backend/db/index";
import env from "env-var";

export default new Elysia().get(
    "/",
    async ({ request, set }) => {
        console.log("[SSO DEBUG] Incoming GET from SSO Engine");
        console.log("[SSO DEBUG] Headers:", Object.fromEntries(request.headers.entries()));

        // 1. Extract Authorization Header
        // SSO backend strips "Bearer " prefix before forwarding — header arrives as raw token
        const authHeader = request.headers.get("authorization");
        let ssoToken: string | undefined;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            ssoToken = authHeader.split(" ")[1];
        } else if (authHeader) {
            ssoToken = authHeader; // SSO sends raw token without "Bearer " prefix
        }

        if (!ssoToken) {
            console.log("[SSO DEBUG] No token found in Authorization header");
            set.status = 400;
            return { message: "Token missing" };
        }

        try {
            // 2 & 3. Fetch from External SSO Host (always send with "Bearer " prefix)
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
            console.log("[SSO DEBUG] Full response from SSO /users/me:", JSON.stringify(ssoData, null, 2));
            const userEmail = ssoData?.data?.username;

            if (!userEmail || typeof userEmail !== "string") {
                set.status = 401;
                return { message: "Invalid SSO token payload format" };
            }

            // 4. Find or auto-register user
            let user = await Prisma.user.findFirst({
                where: { email: userEmail },
                include: { userRole: { include: { role: true } } },
            });

            if (!user) {
                console.log("[SSO DEBUG] User not found locally, auto-registering:", userEmail);

                // Determine role from email domain
                // @students.undip.ac.id → mahasiswa
                // @lecturer.undip.ac.id → dosen_pembimbing
                // other                 → no role assigned (admin must set manually)
                let roleName: string | null = null;
                if (userEmail.endsWith("@students.undip.ac.id")) {
                    roleName = "mahasiswa";
                } else if (userEmail.endsWith("@lecturer.undip.ac.id")) {
                    roleName = "dosen_pembimbing";
                }

                const ssoName: string = ssoData?.data?.name ?? userEmail;

                const created = await Prisma.user.create({
                    data: {
                        name: ssoName,
                        email: userEmail,
                        emailVerified: true,
                        isAnonymous: false,
                    },
                });

                if (roleName) {
                    const localRole = await Prisma.role.findFirst({ where: { name: roleName } });
                    if (localRole) {
                        await Prisma.userRole.create({ data: { userId: created.id, roleId: localRole.id } });
                        console.log("[SSO DEBUG] Auto-assigned role:", roleName);
                    } else {
                        console.log("[SSO DEBUG] Role not found in DB:", roleName);
                    }
                } else {
                    console.log("[SSO DEBUG] No role assigned — email domain not recognized:", userEmail);
                }

                // NOTE: mahasiswa/pegawai profile records are NOT created here.
                // They require nim/nip, departemenId, programStudiId which SSO does not provide.
                // Frontend detects mahasiswa=null or pegawai=null from GET /me and shows a
                // "complete your profile" popup to collect the missing data.

                user = await Prisma.user.findUnique({
                    where: { id: created.id },
                    include: { userRole: { include: { role: true } } },
                });
            }

            if (!user) {
                set.status = 500;
                return { message: "Gagal mendaftarkan akun" };
            }

            // 5. Update updatedAt on login
            await Prisma.user.update({
                where: { id: user.id },
                data: { updatedAt: new Date() },
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

            // 8. Store session so Bearer auth middleware can validate it
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await Prisma.session.create({
                data: {
                    id: crypto.randomUUID(),
                    token: localToken,
                    userId: user.id,
                    expiresAt,
                    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
                    userAgent: request.headers.get("user-agent") ?? null,
                },
            });

            // 9. Return relative callback_url — SSO frontend prepends redirectUri automatically
            // SSO frontend: window.open(redirectUri + callback_url)
            // redirectUri  = "https://apps-fsm.undip.ac.id/persuratan-pengantar-pkl"
            // callback_url = "/sso/callback?token=..."
            // Result       = "https://apps-fsm.undip.ac.id/persuratan-pengantar-pkl/sso/callback?token=..."
            return {
                success: true,
                callback_url: `/sso/callback?token=${localToken}`,
            };
        } catch (error) {
            console.error("SSO Bridge Error:", error);
            set.status = 500;
            return { message: "Internal server error during SSO processing" };
        }
    }
);
