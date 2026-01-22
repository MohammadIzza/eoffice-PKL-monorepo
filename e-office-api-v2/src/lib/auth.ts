import { PrismaClient } from "@backend/db/index.ts";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, bearer } from "better-auth/plugins";

const prisma = new PrismaClient();
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	experimental: {
		joins: true,
	},
	emailAndPassword: {
		enabled: true,
	},
	basePath: "/api/auth",
	plugins: [
		anonymous(),
		bearer(),
	],
});
