// Quick test untuk find correct endpoint path
const API_BASE = "http://localhost:3001";

const pathsToTest = [
	"/public/sign-in",
	"/api/public/sign-in",
];

async function testPath(path: string) {
	try {
		const res = await fetch(`${API_BASE}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "mahasiswa.test@students.undip.ac.id",
				password: "password1234",
			}),
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
	console.log("Testing endpoint paths...\n");

	for (const path of pathsToTest) {
		const found = await testPath(path);
		if (found) {
			console.log(`\n✅ Correct path is: ${path}`);
			break;
		}
	}
}

main();
