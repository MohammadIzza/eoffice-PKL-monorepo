import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { auth } from "@backend/lib/auth.ts";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";
import env from "env-var";

const FE_URL = env.get("FE_URL").asString() || "http://localhost:3000";
const allowedOrigins = [FE_URL, "http://localhost:3000", "http://127.0.0.1:3000"];

export const app = new Elysia()
	.use(swagger())
	.use(
		cors({
			origin: (request) => {
				const origin = request.headers.get("origin");
				if (!origin) return true;
				return allowedOrigins.includes(origin);
			},
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
			exposeHeaders: ["Set-Cookie"],
		}),
	)
	.use(serverTiming())
	.use(
		await autoload({
			types: {
				output: "./autogen.routes.ts",
				typeName: "App",
				useExport: true,
			},
		}),
	)

export type App = typeof app;
