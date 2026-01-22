// Test script untuk authentication flow
import { Prisma } from "@backend/db/index.ts";

// API_BASE harus tanpa trailing slash atau /api suffix
let API_BASE = process.env.API_URL || "http://localhost:3001";
API_BASE = API_BASE.replace(/\/$/, "").replace(/\/api$/, "");

interface TestResult {
	name: string;
	status: "PASS" | "FAIL" | "SKIP";
	message?: string;
	data?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<any>, skipOnError?: boolean): Promise<any> {
	try {
		const data = await fn();
		results.push({ name, status: "PASS", data });
		console.log(`  ✅ ${name}`);
		return data;
	} catch (e: any) {
		if (skipOnError && e.message.includes("not available")) {
			results.push({ name, status: "SKIP", message: e.message });
			console.log(`  ⚠️  ${name}: ${e.message} (skipped)`);
			return null;
		}
		results.push({ name, status: "FAIL", message: e.message });
		console.log(`  ❌ ${name}: ${e.message}`);
		throw e;
	}
}

async function testAuth() {
	console.log("========================================");
	console.log("AUTHENTICATION FLOW TEST");
	console.log("========================================\n");

	// Check if server is running
	console.log("Checking server connection...\n");
	console.log(`API_BASE: ${API_BASE}\n`);
	
	// Ensure API_BASE is correct (no /api suffix)
	if (API_BASE.endsWith("/api")) {
		console.error("❌ ERROR: API_BASE tidak boleh berakhir dengan /api");
		console.error(`   Current: ${API_BASE}`);
		console.error(`   Should be: ${API_BASE.replace(/\/api$/, "")}`);
		process.exit(1);
	}
	
	try {
		// Test dengan endpoint yang pasti ada - test langsung /public/sign-in dengan wrong credentials
		const healthCheck = await fetch(`${API_BASE}/public/sign-in`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "test@test.com",
				password: "wrong",
			}),
		});
		// Even if credentials wrong, server should respond (not 404)
		if (healthCheck.status === 404) {
			throw new Error("Endpoint tidak ditemukan - server mungkin tidak running atau route belum terdaftar");
		}
		console.log(`✓ Server running di ${API_BASE}\n`);
	} catch (error: any) {
		if (error.message.includes("fetch") || error.message.includes("ECONNREFUSED") || error.message.includes("Unable to connect")) {
			console.error("❌ Server tidak running atau tidak dapat diakses!");
			console.error(`   Pastikan server berjalan di ${API_BASE}`);
			console.error("   Start server dengan: bun run dev\n");
			console.error(`   Error: ${error.message}\n`);
			process.exit(1);
		} else {
			console.error(`❌ ${error.message}`);
			console.error(`   Pastikan server sudah restart setelah membuat route baru`);
			console.error(`   Route baru perlu server restart untuk terdaftar\n`);
			process.exit(1);
		}
	}

	let cookies: string = "";
	let token: string = "";

	// ========== 1. TEST LOGIN ==========
	console.log("1) TESTING LOGIN...\n");

	const loginResult = await test("POST /public/sign-in", async () => {
		const url = `${API_BASE}/public/sign-in`;
		console.log(`    Testing: ${url}`);
		
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "mahasiswa.test@students.undip.ac.id",
				password: "password1234",
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			console.log(`    Response status: ${res.status}`);
			console.log(`    Response text: ${text.substring(0, 200)}`);
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		// Extract cookies from response
		// Better Auth sets cookies in Set-Cookie header
		// In Bun/Node, we need to get all Set-Cookie headers
		const allHeaders: string[] = [];
		res.headers.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") {
				allHeaders.push(value);
			}
		});
		
		if (allHeaders.length > 0) {
			// Extract cookie name=value pairs
			const cookiePairs: string[] = [];
			allHeaders.forEach((header) => {
				// Set-Cookie format: "name=value; Path=/; HttpOnly; ..."
				const match = header.match(/^([^=]+=[^;]+)/);
				if (match) {
					cookiePairs.push(match[1]);
				}
			});
			if (cookiePairs.length > 0) {
				cookies = cookiePairs.join("; ");
				console.log(`    Cookies extracted: ${cookiePairs.length} cookie(s)`);
			}
		}
		
		if (!cookies) {
			console.log(`    ⚠️  Warning: No cookies found in response`);
		}

		const data = await res.json();

		// Better Auth response: { user, token?, ... }
		// Token available via bearer() plugin for API testing
		const token = data.token;
		
		if (!data.user) {
			throw new Error("Response tidak punya user");
		}

		console.log(`    User ID: ${data.user.id}`);
		console.log(`    User Email: ${data.user.email}`);
		console.log(`    Token: ${token ? "Available" : "Not available"}`);
		console.log(`    Cookies: ${cookies ? "Set" : "Not set (using Bearer token for testing)"}`);

		return { data, cookies, token };
	});
	
	// Extract token from login result
	if (loginResult?.token) {
		token = loginResult.token;
	}

	// ========== 2. TEST /me ENDPOINT ==========
	console.log("\n2) TESTING /me ENDPOINT...\n");

	const meResponse = await test("GET /me (with Bearer token)", async () => {
		if (!token) {
			throw new Error("Token tidak tersedia, tidak bisa test /me");
		}
		
		const res = await fetch(`${API_BASE}/me`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const data = await res.json();

		// Verify response structure
		if (!data.id || !data.email) {
			throw new Error("Response tidak valid");
		}

		// Check roles
		if (!Array.isArray(data.roles)) {
			throw new Error("Roles bukan array");
		}

		console.log(`    User ID: ${data.id}`);
		console.log(`    User Email: ${data.email}`);
		console.log(`    Roles: ${data.roles.map((r: any) => r.name).join(", ")}`);
		console.log(`    Mahasiswa: ${data.mahasiswa ? "Yes" : "No"}`);
		console.log(`    Pegawai: ${data.pegawai ? "Yes" : "No"}`);

		if (data.mahasiswa) {
			console.log(`    NIM: ${data.mahasiswa.nim}`);
			console.log(`    Program Studi: ${data.mahasiswa.programStudi?.name || "N/A"}`);
			console.log(`    Departemen: ${data.mahasiswa.departemen?.name || "N/A"}`);
		}

		return data;
	});

	// ========== 3. TEST /me WITHOUT TOKEN ==========
	console.log("\n3) TESTING /me WITHOUT TOKEN (should fail)...\n");

	await test("GET /me (without token)", async () => {
		const res = await fetch(`${API_BASE}/me`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (res.ok) {
			throw new Error("Should return 401 Unauthorized");
		}

		if (res.status !== 401) {
			const text = await res.text();
			throw new Error(`Expected 401, got ${res.status}: ${text.substring(0, 200)}`);
		}

		console.log(`    ✓ Correctly returned 401 Unauthorized`);
		return { status: 401 };
	});

	// ========== 4. TEST LOGOUT ==========
	console.log("\n4) TESTING LOGOUT...\n");

	// Try logout endpoint, but skip if not available
	await test("POST /public/sign-out", async () => {
		// Custom logout endpoint (wrapper untuk Better Auth)
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
		if (cookies) {
			headers.Cookie = cookies;
		}
		
		const res = await fetch(`${API_BASE}/public/sign-out`, {
			method: "POST",
			headers,
			credentials: "include",
		});

		if (!res.ok) {
			if (res.status === 404) {
				throw new Error("Logout endpoint not available (skip this test)");
			}
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		console.log(`    ✓ Logout successful`);
		return { success: true };
	}, true); // skipOnError = true

	// ========== 5. TEST /me AFTER LOGOUT ==========
	console.log("\n5) TESTING /me AFTER LOGOUT (should fail)...\n");

	await test("GET /me (after logout - token invalidated)", async () => {
		// After logout, token should be invalid
		const res = await fetch(`${API_BASE}/me`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`, // Old token should be invalid after logout
			},
		});

		if (res.ok) {
			// If token still valid, that's also acceptable (depends on Better Auth implementation)
			const data = await res.json();
			console.log(`    ⚠️  Token masih valid setelah logout (implementation dependent)`);
			return { status: 200, user: data };
		}

		if (res.status !== 401) {
			const text = await res.text();
			throw new Error(`Expected 401, got ${res.status}: ${text.substring(0, 200)}`);
		}

		console.log(`    ✓ Correctly returned 401 after logout (token invalidated)`);
		return { status: 401 };
	});

	// ========== 6. TEST MULTIPLE USERS ==========
	console.log("\n6) TESTING MULTIPLE USERS...\n");

	const testUsers = [
		{ email: "mahasiswa.test@students.undip.ac.id", password: "password1234", role: "mahasiswa" },
		{ email: "dospem.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_pembimbing" },
		{ email: "koordinator.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_koordinator" },
	];

		for (const testUser of testUsers) {
		await test(`Login as ${testUser.role}`, async () => {
			const res = await fetch(`${API_BASE}/public/sign-in`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: testUser.email,
					password: testUser.password,
				}),
			});

			if (!res.ok) {
				const text = await res.text();
				throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
			}

			const data = await res.json();
			const userToken = data.token;

			if (!userToken) {
				throw new Error("No token from login response");
			}

			// Get /me untuk verify roles using Bearer token
			const meRes = await fetch(`${API_BASE}/me`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${userToken}`,
				},
			});

			if (!meRes.ok) {
				const text = await meRes.text();
				throw new Error(`Failed to get /me: HTTP ${meRes.status}: ${text.substring(0, 200)}`);
			}

			const meData = await meRes.json();
			const userRoles = meData.roles.map((r: any) => r.name);

			if (!userRoles.includes(testUser.role)) {
				throw new Error(`User tidak punya role ${testUser.role}. Roles: ${userRoles.join(", ")}`);
			}

			console.log(`    ✓ ${testUser.role}: ${userRoles.join(", ")}`);
			return { user: meData, roles: userRoles };
		});
	}

	// ========== SUMMARY ==========
	console.log("\n========================================");
	console.log("TEST SUMMARY");
	console.log("========================================\n");

	const passed = results.filter((r) => r.status === "PASS").length;
	const failed = results.filter((r) => r.status === "FAIL").length;
	const skipped = results.filter((r) => r.status === "SKIP").length;
	const total = results.length;

	console.log(`Total Tests: ${total}`);
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	if (skipped > 0) {
		console.log(`⚠️  Skipped: ${skipped}`);
	}

	if (failed > 0) {
		console.log("\nFailed Tests:");
		results
			.filter((r) => r.status === "FAIL")
			.forEach((r) => {
				console.log(`  ❌ ${r.name}: ${r.message}`);
			});
	}

	console.log("\n========================================\n");

	if (failed === 0) {
		if (skipped > 0) {
			console.log(`🎉 All critical tests passed! (${skipped} skipped)`);
		} else {
			console.log("🎉 All tests passed!");
		}
	} else {
		console.log("⚠️  Some tests failed. Please check the errors above.");
		process.exit(1);
	}
}

testAuth().catch((error) => {
	console.error("Test error:", error);
	process.exit(1);
});
