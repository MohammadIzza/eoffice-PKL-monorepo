// Comprehensive E2E Test - All Features
import { Prisma } from "@backend/db/index.ts";

const API_BASE = "http://localhost:3001";

interface TestResult {
	name: string;
	status: "PASS" | "FAIL" | "SKIP";
	message?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<any>): Promise<any> {
	try {
		const data = await fn();
		results.push({ name, status: "PASS" });
		console.log(`  ✅ ${name}`);
		return data;
	} catch (e: any) {
		results.push({ name, status: "FAIL", message: e.message });
		console.log(`  ❌ ${name}: ${e.message}`);
		return null;
	}
}

async function testE2EAll() {
	console.log("========================================");
	console.log("COMPREHENSIVE E2E TEST - ALL FEATURES");
	console.log("========================================\n");

	// Check server
	console.log("Checking server connection...\n");
	try {
		const healthCheck = await fetch(`${API_BASE}/swagger`, { method: "GET" });
		console.log(`✓ Server running di ${API_BASE}\n`);
	} catch (error: any) {
		console.error("❌ Server tidak running!");
		console.error("   Start server dengan: bun run dev\n");
		process.exit(1);
	}

	const sessions: Record<string, string> = {};

	// ========== 1. AUTHENTICATION ==========
	console.log("1) TESTING AUTHENTICATION...\n");

	await test("Login as mahasiswa", async () => {
		const res = await fetch(`${API_BASE}/public/sign-in`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "mahasiswa.test@students.undip.ac.id",
				password: "password1234",
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
		}

		const data = await res.json();
		if (!data.token) {
			throw new Error("No token in response");
		}

		sessions.mahasiswa = data.token;
		return data;
	});

	await test("Get /me endpoint", async () => {
		if (!sessions.mahasiswa) {
			throw new Error("No mahasiswa session");
		}

		const res = await fetch(`${API_BASE}/me`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.mahasiswa}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
		}

		const data = await res.json();
		if (!data.id || !data.roles || data.roles.length === 0) {
			throw new Error("Invalid user data");
		}

		return data;
	});

	await test("Logout", async () => {
		if (!sessions.mahasiswa) {
			throw new Error("No mahasiswa session");
		}

		const res = await fetch(`${API_BASE}/public/sign-out`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.mahasiswa}`,
			},
		});

		if (!res.ok && res.status !== 404) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
		}

		return { success: true };
	});

	// ========== 2. LETTER SUBMISSION ==========
	console.log("\n2) TESTING LETTER SUBMISSION...\n");

	// Re-login untuk letter operations
	await test("Re-login for letter operations", async () => {
		const res = await fetch(`${API_BASE}/public/sign-in`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "mahasiswa.test@students.undip.ac.id",
				password: "password1234",
			}),
		});

		const data = await res.json();
		sessions.mahasiswa = data.token;
		return data;
	});

	// Get master data
	let prodiId = "";
	let dospemUserId = "";

	await test("Get program studi with koordinator", async () => {
		// Find program studi that has a koordinator PKL assigned
		// Koordinator is a pegawai with role dosen_koordinator and programStudiId
		const prodiWithKoordinator = await Prisma.programStudi.findFirst({
			where: {
				pegawai: {
					some: {
						user: {
							userRole: {
								some: {
									role: { name: "dosen_koordinator" },
								},
							},
						},
					},
				},
			},
			orderBy: { name: "asc" },
		});

		if (!prodiWithKoordinator) {
			// Fallback: just get any prodi
			const anyProdi = await Prisma.programStudi.findFirst({
				orderBy: { name: "asc" },
			});
			if (!anyProdi) {
				throw new Error("Program studi tidak ditemukan di database");
			}
			prodiId = anyProdi.id;
			console.log(`    ⚠️  Found: ${anyProdi.name} (${anyProdi.code}) - but no koordinator assigned`);
			return anyProdi;
		}

		prodiId = prodiWithKoordinator.id;
		console.log(`    ✓ Found: ${prodiWithKoordinator.name} (${prodiWithKoordinator.code}) with koordinator`);
		return prodiWithKoordinator;
	});

	await test("Get dosen pembimbing", async () => {
		const dospem = await Prisma.user.findFirst({
			where: {
				userRole: {
					some: {
						role: { name: "dosen_pembimbing" },
					},
				},
			},
		});

		if (!dospem) {
			throw new Error("Dosen pembimbing tidak ditemukan");
		}

		dospemUserId = dospem.id;
		return dospem;
	});

	// Cleanup existing letters
	await test("Cleanup existing letters", async () => {
		const mahasiswaUser = await Prisma.user.findFirst({
			where: { email: "mahasiswa.test@students.undip.ac.id" },
		});

		if (!mahasiswaUser) {
			throw new Error("Mahasiswa user tidak ditemukan");
		}

		// Fix: Use valid enum values (PROCESSING, not PENDING)
		await Prisma.letterInstance.updateMany({
			where: {
				createdById: mahasiswaUser.id,
				status: "PROCESSING", // Only PROCESSING, not PENDING (invalid enum)
			},
			data: { status: "CANCELLED" },
		});
		
		console.log(`    ✓ Cleaned existing PROCESSING letters`);
		return { cleaned: true };
	});

	let letterId = "";

	await test("Submit PKL letter", async () => {
		if (!sessions.mahasiswa || !prodiId || !dospemUserId) {
			throw new Error("Missing required data");
		}

		const res = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				prodiId,
				dosenPembimbingUserId: dospemUserId,
				formData: {
					nim: "24060122140199",
					nama: "Test User E2E",
					tempatPKL: "PT Test E2E",
					alamatPKL: "Jakarta",
					judul: "Test E2E System",
				},
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const data = await res.json();
		if (!data.success || !data.data?.letterId) {
			throw new Error(`Submit failed: ${data.message || JSON.stringify(data)}`);
		}

		letterId = data.data.letterId;
		return data;
	});

	await test("Get my letters", async () => {
		if (!sessions.mahasiswa) {
			throw new Error("No session");
		}

		const res = await fetch(`${API_BASE}/letter/my`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.mahasiswa}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
		}

		const data = await res.json();
		if (!Array.isArray(data.data)) {
			throw new Error("Invalid response format");
		}

		return data;
	});

	await test("Get letter detail", async () => {
		if (!sessions.mahasiswa || !letterId) {
			throw new Error("Missing data");
		}

		const res = await fetch(`${API_BASE}/letter/${letterId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.mahasiswa}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
		}

		const data = await res.json();
		if (!data.data || !data.data.id) {
			throw new Error("Invalid letter data");
		}

		return data;
	});

	// ========== 3. APPROVAL WORKFLOW ==========
	console.log("\n3) TESTING APPROVAL WORKFLOW...\n");

	// Login as approvers
	await test("Login as dosen pembimbing", async () => {
		const res = await fetch(`${API_BASE}/public/sign-in`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "dospem.test@lecturer.undip.ac.id",
				password: "password1234",
			}),
		});

		const data = await res.json();
		sessions.dospem = data.token;
		return data;
	});

	await test("Get queue for dosen pembimbing", async () => {
		if (!sessions.dospem) {
			throw new Error("No dospem session");
		}

		const res = await fetch(`${API_BASE}/letter/queue?activeRole=dosen_pembimbing`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.dospem}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
		}

		const data = await res.json();
		return data;
	});

	await test("Approve letter", async () => {
		if (!sessions.dospem || !letterId) {
			throw new Error("Missing data");
		}

		const res = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessions.dospem}`,
			},
			body: JSON.stringify({
				comment: "E2E Test approval",
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const data = await res.json();
		return data;
	});

	// ========== SUMMARY ==========
	console.log("\n========================================");
	console.log("E2E TEST SUMMARY");
	console.log("========================================\n");

	const passed = results.filter((r) => r.status === "PASS").length;
	const failed = results.filter((r) => r.status === "FAIL").length;
	const total = results.length;

	console.log(`Total Tests: ${total}`);
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}\n`);

	if (failed > 0) {
		console.log("Failed Tests:");
		results
			.filter((r) => r.status === "FAIL")
			.forEach((r) => {
				console.log(`  ❌ ${r.name}: ${r.message}`);
			});
		console.log("\n");
	}

	if (failed === 0) {
		console.log("🎉 All E2E tests passed!");
	} else {
		console.log("⚠️  Some tests failed. Please check the errors above.");
		process.exit(1);
	}
}

testE2EAll().catch((error) => {
	console.error("Test error:", error);
	process.exit(1);
});
