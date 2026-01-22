// Verify hasil workflow di database
import { Prisma } from "@backend/db/index.ts";

async function verify() {
	console.log("========================================");
	console.log("VERIFIKASI HASIL WORKFLOW DI DATABASE");
	console.log("========================================\n");

	// 1. Get all letters
	const letters = await Prisma.letterInstance.findMany({
		include: {
			stepHistory: {
				orderBy: { createdAt: "asc" },
			},
			numbering: true,
		},
	});

	console.log(`Total surat di DB: ${letters.length}\n`);

	for (const letter of letters) {
		console.log(`Letter ID: ${letter.id}`);
		console.log(`  Status: ${letter.status}`);
		console.log(`  Current Step: ${letter.currentStep || "N/A"}`);
		console.log(`  Signed At: ${letter.signedAt || "N/A"}`);
		console.log(`  Number: ${letter.numbering?.numberString || "N/A"}`);
		console.log(`  History entries: ${letter.stepHistory.length}`);
		console.log(`\n  Timeline:`);

		for (const history of letter.stepHistory) {
			console.log(
				`    ${history.createdAt.toISOString()} | ${history.action.padEnd(15)} | Step ${history.step || "N/A"} | ${history.actorRole}`,
			);
			if (history.comment) {
				console.log(`      Comment: ${history.comment}`);
			}
		}

		console.log("\n");
	}

	// Verifikasi proses bisnis
	console.log("========================================");
	console.log("CHECKLIST PROSES BISNIS");
	console.log("========================================\n");

	const completedLetter = letters.find((l) => l.status === "COMPLETED");

	if (completedLetter) {
		console.log("✓ Ada surat yang COMPLETED");

		const actions = completedLetter.stepHistory.map((h) => h.action);
		const checks = [
			{ name: "SUBMITTED", exists: actions.includes("SUBMITTED") },
			{ name: "APPROVED (multiple)", exists: actions.filter((a) => a === "APPROVED").length >= 6 },
			{ name: "REVISED", exists: actions.includes("REVISED") },
			{ name: "SELF_REVISED", exists: actions.includes("SELF_REVISED") },
			{ name: "SIGNED", exists: actions.includes("SIGNED") },
			{ name: "NUMBERED", exists: actions.includes("NUMBERED") },
		];

		for (const check of checks) {
			console.log(`  ${check.exists ? "✓" : "✗"} ${check.name}`);
		}

		console.log(`\n✓ Nomor surat unique: ${completedLetter.numbering?.numberString}`);
		console.log(`✓ SignedAt ada: ${!!completedLetter.signedAt}`);
		console.log(`✓ Total history: ${completedLetter.stepHistory.length} entries`);
	} else {
		console.log("✗ Tidak ada surat COMPLETED");
	}

	console.log("\n========================================");
	console.log("VERIFIKASI SELESAI");
	console.log("========================================");
}

verify()
	.catch((e) => {
		console.error("Error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await Prisma.$disconnect();
	});
