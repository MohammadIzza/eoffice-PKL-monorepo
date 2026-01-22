// Test logout endpoint paths
const API_BASE = "http://localhost:3001";

const pathsToTest = [
	"/api/auth/sign-out",
	"/api/auth/sign-out/",
	"/auth/sign-out",
];

async function testPath(path: string, token: string) {
	try {
		const res = await fetch(`${API_BASE}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const text = await res.text();
		console.log(`\n${path}:`);
		console.log(`  Status: ${res.status}`);
		console.log(`  Response: ${text.substring(0, 100)}`);

		if (res.ok) {
			console.log(`  ✅ PATH FOUND!`);
			return true;
		}
	} catch (error: any) {
		console.log(`\n${path}:`);
		console.log(`  ❌ Error: ${error.message}`);
	}
	return false;
}

async function main() {
	// First login to get token
	console.log("Logging in to get token...\n");
	const loginRes = await fetch(`${API_BASE}/public/sign-in`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			username: "mahasiswa.test@students.undip.ac.id",
			password: "password1234",
		}),
	});
	
	const loginData = await loginRes.json();
	const token = loginData.token;
	
	if (!token) {
		console.error("❌ No token from login");
		return;
	}
	
	console.log(`Token: ${token.substring(0, 20)}...\n`);
	console.log("Testing logout paths...\n");

	for (const path of pathsToTest) {
		const found = await testPath(path, token);
		if (found) {
			console.log(`\n✅ Correct logout path is: ${path}`);
			break;
		}
	}
}

main();
