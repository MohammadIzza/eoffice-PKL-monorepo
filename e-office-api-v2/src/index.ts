import { config } from "./config";
import { Prisma } from "@backend/db/index";
import { app } from "./server";

const signals = ["SIGINT", "SIGTERM"];

for (const signal of signals) {
	process.on(signal, async () => {
		console.log(`Received ${signal}. Initiating graceful shutdown...`);
		await app.stop();
		process.exit(0);
	});
}

process.on("uncaughtException", (error) => {
	console.error(error);
});

process.on("unhandledRejection", (error) => {
	console.error(error);
});

await Prisma.$connect();
console.log("Database was connected!");

app.listen(config.PORT, () =>
	console.log(`Server started at ${app.server?.url.origin}`),
);
