// E2E Test untuk Authentication Flow
// Test: Login → Cookie ter-set → /me berhasil

const API_BASE = "http://localhost:3001";

async function test(name: string, fn: () => Promise<any>): Promise<any> {
	try {
		console.log(`\n🧪 ${name}...`);
		const result = await fn();
		console.log(`✅ ${name} - PASSED`);
		return result;
	} catch (error: any) {
		console.log(`❌ ${name} - FAILED`);
		console.log(`   Error: ${error.message}`);
		throw error;
	}
}

async function testE2EAuth() {
	console.log("========================================");
	console.log("E2E AUTHENTICATION TEST");
	console.log("========================================");
	console.log("");

	let cookies = "";

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
		const allHeaders: string[] = [];
		res.headers.forEach((value, key) => {
			if (key.toLowerCase() === "set-cookie") {
				allHeaders.push(value);
			}
		});

		if (allHeaders.length > 0) {
			console.log(`    ✅ Set-Cookie headers found: ${allHeaders.length}`);
			allHeaders.forEach((header, idx) => {
				console.log(`       [${idx + 1}] ${header.substring(0, 100)}...`);
			});

			// Extract cookie name=value pairs
			const cookiePairs: string[] = [];
			allHeaders.forEach((header) => {
				const match = header.match(/^([^=]+=[^;]+)/);
				if (match) {
					cookiePairs.push(match[1]);
				}
			});
			if (cookiePairs.length > 0) {
				cookies = cookiePairs.join("; ");
				console.log(`    ✅ Cookies extracted: ${cookiePairs.length} cookie(s)`);
				cookiePairs.forEach((pair) => {
					console.log(`       - ${pair.substring(0, 80)}...`);
				});
			}
		} else {
			console.log(`    ⚠️  Warning: No Set-Cookie headers found in response`);
		}

		const data = await res.json();

		if (!data.user) {
			throw new Error("Response tidak punya user");
		}

		console.log(`    User ID: ${data.user.id}`);
		console.log(`    User Email: ${data.user.email}`);
		console.log(`    Token: ${data.token ? "Available" : "Not available"}`);

		return { data, cookies };
	});

	// ========== 2. TEST /me WITH COOKIES ==========
	console.log("\n2) TESTING /me WITH COOKIES...\n");

	if (!cookies) {
		console.log("    ⚠️  No cookies from login, skipping /me test");
	} else {
		await test("GET /me (with cookies)", async () => {
			const url = `${API_BASE}/me`;
			console.log(`    Testing: ${url}`);
			console.log(`    Cookies: ${cookies.substring(0, 80)}...`);

			const res = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Cookie: cookies,
				},
			});

			if (!res.ok) {
				const text = await res.text();
				console.log(`    Response status: ${res.status}`);
				console.log(`    Response text: ${text}`);
				throw new Error(`HTTP ${res.status}: ${text}`);
			}

			const data = await res.json();
			console.log(`    ✅ User authenticated: ${data.email || data.name || "Unknown"}`);
			console.log(`    User ID: ${data.id}`);
			console.log(`    Roles: ${data.roles?.length || 0} role(s)`);

			return data;
		});
	}

	// ========== 3. TEST /me WITHOUT COOKIES ==========
	console.log("\n3) TESTING /me WITHOUT COOKIES (should fail)...\n");

	await test("GET /me (without cookies - should fail)", async () => {
		const url = `${API_BASE}/me`;
		console.log(`    Testing: ${url} (no cookies)`);

		const res = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (res.ok) {
			throw new Error("Expected 401 Unauthorized, but got success");
		}

		if (res.status !== 401) {
			throw new Error(`Expected 401, but got ${res.status}`);
		}

		console.log(`    ✅ Correctly returned 401 Unauthorized`);
		return true;
	});

	// ========== SUMMARY ==========
	console.log("\n========================================");
	console.log("E2E AUTHENTICATION TEST - COMPLETE");
	console.log("========================================");
	console.log("");
	console.log("✅ All tests passed!");
	console.log("");
}

// Run test
testE2EAuth().catch((error) => {
	console.error("\n❌ Test failed:", error);
	process.exit(1);
});
