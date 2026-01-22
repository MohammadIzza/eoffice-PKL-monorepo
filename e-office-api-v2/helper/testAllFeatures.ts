// Test semua fitur: approve, reject, revise, history, comment
import { Prisma } from "@backend/db/index.ts";

const API_BASE = "http://localhost:3001";

async function testAllFeatures() {
	console.log("========================================");
	console.log("TEST SEMUA FITUR: APPROVE, REJECT, REVISE, HISTORY, COMMENT");
	console.log("========================================\n");

	const sessions: Record<string, string> = {};

	// ========== 1. LOGIN ==========
	console.log("1) LOGIN...\n");

	const users = [
		{ email: "mahasiswa.test@students.undip.ac.id", password: "password1234", role: "mahasiswa" },
		{ email: "dospem.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_pembimbing" },
		{ email: "koordinator.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_koordinator" },
	];

	for (const user of users) {
		const res = await fetch(`${API_BASE}/public/sign-in`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: user.email, password: user.password }),
		});
		const data = await res.json();
		if (data.token) {
			sessions[user.role] = data.token;
			console.log(`  ✓ ${user.role}`);
		}
	}

	// ========== 2. SUBMIT SURAT BARU ==========
	console.log("\n2) SUBMIT SURAT BARU...\n");

	const prodiInformatika = await Prisma.programStudi.findFirst({
		where: { name: "S1 Informatika" },
	});
	const dospemUser = await Prisma.user.findFirst({
		where: { email: "dospem.test@lecturer.undip.ac.id" },
	});

	let letterId: string;

	try {
		const submitRes = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				prodiId: prodiInformatika!.id,
				dosenPembimbingUserId: dospemUser!.id,
				formData: {
					nim: "24060122140199",
					nama: "Test User",
					tempatPKL: "PT Test",
					alamatPKL: "Jakarta",
					judul: "Test System",
				},
			}),
		});

		const text = await submitRes.text();
		let submitData;
		try {
			submitData = JSON.parse(text);
		} catch {
			console.log(`  ✗ Submit response bukan JSON:`, text.substring(0, 200));
			return;
		}

		if (submitData.success && submitData.data?.letterId) {
			letterId = submitData.data.letterId;
			console.log(`  ✓ Submit sukses! Letter ID: ${letterId}`);
		} else {
			console.log(`  ✗ Submit FAILED:`, submitData);
			return;
		}
	} catch (e: any) {
		console.log(`  ✗ Submit ERROR:`, e.message);
		return;
	}

	// ========== 3. TEST APPROVE DENGAN COMMENT ==========
	console.log("\n3) TEST APPROVE DENGAN COMMENT...\n");

	try {
		const approveRes = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
			},
			body: JSON.stringify({
				comment: "Data mahasiswa sudah lengkap dan sesuai, saya setujui untuk dilanjutkan ke koordinator",
			}),
		});

		const approveData = await approveRes.json();
		
		if (approveData.success) {
			console.log(`  ✓ Approve sukses dengan comment`);
			console.log(`    Current Step: ${approveData.data.currentStep}`);
			console.log(`    Next Role: ${approveData.data.nextStepRole}`);
		} else {
			console.log(`  ✗ Approve FAILED:`, approveData);
		}
	} catch (e: any) {
		console.log(`  ✗ Approve ERROR:`, e.message);
	}

	// ========== 4. TEST REVISE DENGAN COMMENT ==========
	console.log("\n4) TEST REVISE DENGAN COMMENT...\n");

	try {
		const reviseRes = await fetch(`${API_BASE}/letter/${letterId}/revise`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_koordinator}`,
			},
			body: JSON.stringify({
				comment: "Mohon lengkapi alamat instansi PKL dengan lebih detail termasuk kode pos dan nomor telepon",
			}),
		});

		const reviseData = await reviseRes.json();
		
		if (reviseData.success) {
			console.log(`  ✓ Revise sukses dengan comment`);
			console.log(`    Rollback ke step: ${reviseData.data.currentStep}`);
			console.log(`    Message: ${reviseData.data.message}`);
		} else {
			console.log(`  ✗ Revise FAILED:`, reviseData);
		}
	} catch (e: any) {
		console.log(`  ✗ Revise ERROR:`, e.message);
	}

	// ========== 5. RE-APPROVE SETELAH REVISE ==========
	console.log("\n5) RE-APPROVE SETELAH REVISE...\n");

	try {
		const reApproveRes = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
			},
			body: JSON.stringify({
				comment: "Setelah revisi, data sudah lengkap. Saya setujui kembali",
			}),
		});

		const reApproveData = await reApproveRes.json();
		
		if (reApproveData.success) {
			console.log(`  ✓ Re-approve sukses`);
			console.log(`    Current Step: ${reApproveData.data.currentStep}`);
		} else {
			console.log(`  ✗ Re-approve FAILED:`, reApproveData);
		}
	} catch (e: any) {
		console.log(`  ✗ Re-approve ERROR:`, e.message);
	}

	// ========== 6. SUBMIT SURAT KEDUA UNTUK TEST REJECT ==========
	console.log("\n6) SUBMIT SURAT KEDUA UNTUK TEST REJECT...\n");

	let letterId2: string;

	try {
		const submit2Res = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				prodiId: prodiInformatika!.id,
				dosenPembimbingUserId: dospemUser!.id,
				formData: {
					nim: "24060122140200",
					nama: "Test User 2",
					tempatPKL: "PT Test 2",
					alamatPKL: "Bandung",
					judul: "Test System 2",
				},
			}),
		});

		const submit2Data = await submit2Res.json();
		letterId2 = submit2Data.data.letterId;
		console.log(`  ✓ Submit surat kedua sukses! Letter ID: ${letterId2}`);
	} catch (e: any) {
		console.log(`  ✗ Submit kedua ERROR:`, e.message);
		return;
	}

	// ========== 7. TEST REJECT DENGAN COMMENT ==========
	console.log("\n7) TEST REJECT DENGAN COMMENT...\n");

	try {
		const rejectRes = await fetch(`${API_BASE}/letter/${letterId2}/reject`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
			},
			body: JSON.stringify({
				comment: "Data mahasiswa tidak lengkap dan tidak sesuai dengan ketentuan yang berlaku. Surat ditolak",
			}),
		});

		const rejectData = await rejectRes.json();
		
		if (rejectData.success) {
			console.log(`  ✓ Reject sukses dengan comment`);
			console.log(`    Status: ${rejectData.data.status}`);
		} else {
			console.log(`  ✗ Reject FAILED:`, rejectData);
		}
	} catch (e: any) {
		console.log(`  ✗ Reject ERROR:`, e.message);
	}

	// ========== 8. VERIFIKASI HISTORY & COMMENT ==========
	console.log("\n8) VERIFIKASI HISTORY & COMMENT...\n");

	const letters = await Prisma.letterInstance.findMany({
		where: {
			id: { in: [letterId, letterId2] },
		},
		include: {
			stepHistory: {
				orderBy: { createdAt: "asc" },
				include: {
					actor: {
						select: { name: true, email: true },
					},
				},
			},
		},
	});

	for (const letter of letters) {
		console.log(`\n  Letter ID: ${letter.id}`);
		console.log(`  Status: ${letter.status}`);
		console.log(`  Total History: ${letter.stepHistory.length} entries\n`);

		for (const history of letter.stepHistory) {
			const hasComment = !!history.comment;
			console.log(
				`    [${history.createdAt.toISOString()}] ${history.action.padEnd(12)} | Step ${String(history.step || "N/A").padEnd(2)} | ${history.actorRole.padEnd(20)} | ${hasComment ? "✓ Comment" : "✗ No Comment"}`,
			);
			if (history.comment) {
				console.log(`      "${history.comment}"`);
			}
		}
	}

	// ========== 9. CHECKLIST FITUR ==========
	console.log("\n========================================");
	console.log("CHECKLIST FITUR");
	console.log("========================================\n");

	const letter1 = letters.find((l) => l.id === letterId);
	const letter2 = letters.find((l) => l.id === letterId2);

	if (letter1) {
		const actions1 = letter1.stepHistory.map((h) => h.action);
		const hasComments1 = letter1.stepHistory.some((h) => !!h.comment);

		console.log(`Letter 1 (${letter1.id}):`);
		console.log(`  ✓ APPROVED: ${actions1.includes("APPROVED") ? "ADA" : "TIDAK ADA"}`);
		console.log(`  ✓ REVISED: ${actions1.includes("REVISED") ? "ADA" : "TIDAK ADA"}`);
		console.log(`  ✓ Comment di history: ${hasComments1 ? "ADA" : "TIDAK ADA"}`);
		console.log(`  ✓ Total history entries: ${letter1.stepHistory.length}`);
	}

	if (letter2) {
		const actions2 = letter2.stepHistory.map((h) => h.action);
		const hasComments2 = letter2.stepHistory.some((h) => !!h.comment);

		console.log(`\nLetter 2 (${letter2.id}):`);
		console.log(`  ✓ REJECTED: ${actions2.includes("REJECTED") ? "ADA" : "TIDAK ADA"}`);
		console.log(`  ✓ Status REJECTED: ${letter2.status === "REJECTED" ? "BENAR" : "SALAH"}`);
		console.log(`  ✓ Comment di history: ${hasComments2 ? "ADA" : "TIDAK ADA"}`);
		console.log(`  ✓ Total history entries: ${letter2.stepHistory.length}`);
	}

	console.log("\n========================================");
	console.log("TEST SELESAI");
	console.log("========================================\n");
}

testAllFeatures()
	.catch((e) => {
		console.error("Test ERROR:", e);
		process.exit(1);
	})
	.finally(async () => {
		await Prisma.$disconnect();
		process.exit(0);
	});
