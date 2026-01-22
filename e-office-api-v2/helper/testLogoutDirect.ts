// Direct test untuk logout endpoint
const API_BASE = "http://localhost:3001";

async function main() {
	console.log("Testing logout endpoint directly...\n");
	
	// 1. Login dulu
	console.log("1. Logging in...");
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
	
	console.log(`✓ Login successful, token: ${token.substring(0, 20)}...\n`);
	
	// 2. Test logout
	console.log("2. Testing logout...");
	const logoutRes = await fetch(`${API_BASE}/public/sign-out`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		credentials: "include",
	});
	
	console.log(`Status: ${logoutRes.status}`);
	const text = await logoutRes.text();
	console.log(`Response: ${text.substring(0, 200)}`);
	
	if (logoutRes.ok) {
		console.log("\n✅ Logout endpoint working!");
	} else {
		console.log(`\n❌ Logout failed: ${logoutRes.status}`);
	}
}

main();
