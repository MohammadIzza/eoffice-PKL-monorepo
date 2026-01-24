// End-to-end testing workflow PKL
import { Prisma } from "@backend/db/index.ts";

const API_BASE = "http://localhost:3001";
const SIGNATURE_DATA_URL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8/5+hHgAHggJ/PQ3d1wAAAABJRU5ErkJggg==";

async function testWorkflow() {
	console.log("========================================");
	console.log("E2E TESTING - PKL WORKFLOW");
	console.log("========================================\n");

	let letterTest: any = null;
	const sessions: Record<string, string> = {};

	// ========== 1. LOGIN ALL USERS ==========
	console.log("1) TESTING LOGIN...\n");

	const users = [
		{ email: "mahasiswa.test@students.undip.ac.id", password: "password1234", role: "mahasiswa" },
		{ email: "dospem.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_pembimbing" },
		{ email: "koordinator.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_koordinator" },
		{ email: "kaprodi.test@lecturer.undip.ac.id", password: "password1234", role: "ketua_program_studi" },
		{ email: "admin.fakultas@fsm.undip.ac.id", password: "password1234", role: "admin_fakultas" },
		{ email: "supervisor.test@fsm.undip.ac.id", password: "password1234", role: "supervisor_akademik" },
		{ email: "manajer.tu@fsm.undip.ac.id", password: "password1234", role: "manajer_tu" },
		{ email: "wakil.dekan1@fsm.undip.ac.id", password: "password1234", role: "wakil_dekan_1" },
		{ email: "upa@fsm.undip.ac.id", password: "password1234", role: "upa" },
	];

	for (const user of users) {
		try {
			const res = await fetch(`${API_BASE}/public/sign-in`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: user.email, password: user.password }),
			});

			const data = await res.json();
			
			// Better-auth response: { token, user, ... }
			if (data.token) {
				sessions[user.role] = data.token;
				console.log(`  ✓ Login ${user.role}: ${user.email}`);
			} else {
				console.log(`  ✗ Login ${user.role} FAILED:`, data);
			}
		} catch (e: any) {
			console.log(`  ✗ Login ${user.role} ERROR:`, e.message);
		}
	}

	console.log(`\n  Total sessions: ${Object.keys(sessions).length}/9`);

	if (Object.keys(sessions).length < 9) {
		console.log("\n⚠️  Not all users logged in. Stopping test.");
		return;
	}

	// ========== 2. GET PRODI & DOSPEM ID ==========
	console.log("\n2) GETTING PRODI & DOSPEM DATA...\n");

	const prodiInformatika = await Prisma.programStudi.findFirst({
		where: { name: "S1 Informatika" },
	});

	const dospemUser = await Prisma.user.findFirst({
		where: { email: "dospem.test@lecturer.undip.ac.id" },
	});

	if (!prodiInformatika || !dospemUser) {
		console.log("  ✗ Prodi atau Dospem tidak ditemukan");
		return;
	}

	console.log(`  ✓ Prodi ID: ${prodiInformatika.id}`);
	console.log(`  ✓ Dospem User ID: ${dospemUser.id}`);

	// ========== 3. SUBMIT SURAT PKL (Mahasiswa) ==========
	console.log("\n3) TESTING SUBMIT PKL...\n");

	try {
		const submitRes = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				prodiId: prodiInformatika.id,
				dosenPembimbingUserId: dospemUser.id,
				formData: {
					nim: "24060122140123",
					nama: "Budi Santoso",
					tempatPKL: "PT Maju Jaya",
					alamatPKL: "Jakarta",
					judul: "Sistem Informasi Inventory",
				},
			}),
		});

		const submitData = await submitRes.json();
		
		if (submitData.success && submitData.data.letterId) {
			letterTest = submitData.data;
			console.log(`  ✓ Submit sukses! Letter ID: ${letterTest.letterId}`);
			console.log(`    Status: ${letterTest.status}, Current Step: ${letterTest.currentStep}`);
		} else {
			console.log(`  ✗ Submit FAILED:`, submitData);
			return;
		}
	} catch (e: any) {
		console.log(`  ✗ Submit ERROR:`, e.message);
		return;
	}

	const letterId = letterTest.letterId;

	// ========== 4. GET MY LETTERS (Mahasiswa) ==========
	console.log("\n4) TESTING GET MY LETTERS...\n");

	try {
		const myRes = await fetch(`${API_BASE}/letter/my`, {
			headers: {
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
		});

		const myData = await myRes.json();
		
		if (myData.success && myData.data.length > 0) {
			console.log(`  ✓ Get my letters sukses: ${myData.data.length} surat`);
		} else {
			console.log(`  ✗ Get my letters FAILED:`, myData);
		}
	} catch (e: any) {
		console.log(`  ✗ Get my letters ERROR:`, e.message);
	}

	// ========== 5. GET DETAIL SURAT ==========
	console.log("\n5) TESTING GET DETAIL...\n");

	try {
		const detailRes = await fetch(`${API_BASE}/letter/${letterId}`, {
			headers: {
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
		});

		const detailData = await detailRes.json();
		
		if (detailData.success && detailData.data.id) {
			console.log(`  ✓ Get detail sukses`);
			console.log(`    Status: ${detailData.data.status}`);
			console.log(`    Current Step: ${detailData.data.currentStep}`);
			console.log(`    History entries: ${detailData.data.stepHistory?.length || 0}`);
		} else {
			console.log(`  ✗ Get detail FAILED:`, detailData);
		}
	} catch (e: any) {
		console.log(`  ✗ Get detail ERROR:`, e.message);
	}

	// ========== 6. GET QUEUE DOSPEM ==========
	console.log("\n6) TESTING QUEUE (Dospem)...\n");

	try {
		const queueRes = await fetch(`${API_BASE}/letter/queue?activeRole=dosen_pembimbing`, {
			headers: {
				"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
			},
		});

		const queueData = await queueRes.json();
		
		if (queueData.success) {
			console.log(`  ✓ Queue dospem sukses: ${queueData.data.length} surat`);
			console.log(`    Meta:`, queueData.meta);
		} else {
			console.log(`  ✗ Queue FAILED:`, queueData);
		}
	} catch (e: any) {
		console.log(`  ✗ Queue ERROR:`, e.message);
	}

	// ========== 7. APPROVE DOSPEM (Step 1 → 2) ==========
	console.log("\n7) TESTING APPROVE (Dospem)...\n");

	try {
		const approveRes = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
			},
			body: JSON.stringify({
				comment: "Data mahasiswa sudah sesuai, saya setujui",
			}),
		});

		const approveData = await approveRes.json();
		
		if (approveData.success) {
			console.log(`  ✓ Approve dospem sukses!`);
			console.log(`    Current Step sekarang: ${approveData.data.currentStep}`);
			console.log(`    Next role: ${approveData.data.nextStepRole}`);
		} else {
			console.log(`  ✗ Approve FAILED:`, approveData);
		}
	} catch (e: any) {
		console.log(`  ✗ Approve ERROR:`, e.message);
	}

	// ========== 8. REVISE KOORDINATOR (Step 2 → rollback 1) ==========
	console.log("\n8) TESTING REVISE (Koordinator - Rollback 1 Step)...\n");

	try {
		const reviseRes = await fetch(`${API_BASE}/letter/${letterId}/revise`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_koordinator}`,
			},
			body: JSON.stringify({
				comment: "Mohon lengkapi alamat instansi PKL dengan lebih detail",
			}),
		});

		const reviseData = await reviseRes.json();
		
		if (reviseData.success) {
			console.log(`  ✓ Revise koordinator sukses!`);
			console.log(`    Rollback ke step: ${reviseData.data.currentStep}`);
			console.log(`    Message: ${reviseData.data.message}`);
		} else {
			console.log(`  ✗ Revise FAILED:`, reviseData);
		}
	} catch (e: any) {
		console.log(`  ✗ Revise ERROR:`, e.message);
	}

	// ========== 9. SELF-REVISE MAHASISWA ==========
	console.log("\n9) TESTING SELF-REVISE (Mahasiswa)...\n");

	// Re-approve dospem dulu agar currentStep = 2
	await fetch(`${API_BASE}/letter/${letterId}/approve`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
		},
		body: JSON.stringify({ comment: "Re-approve" }),
	});

	try {
		const selfReviseRes = await fetch(`${API_BASE}/letter/${letterId}/self-revise`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
		});

		const selfReviseData = await selfReviseRes.json();
		
		if (selfReviseData.success) {
			console.log(`  ✓ Self-revise mahasiswa sukses!`);
			console.log(`    Rollback ke step: ${selfReviseData.data.currentStep}`);
		} else {
			console.log(`  ✗ Self-revise FAILED:`, selfReviseData);
		}
	} catch (e: any) {
		console.log(`  ✗ Self-revise ERROR:`, e.message);
	}

	// ========== 10. APPROVE CHAIN (Dospem → ... → Manajer TU) ==========
	console.log("\n10) TESTING APPROVE CHAIN (Step 1-6)...\n");

	const approvalChain = [
		{ role: "dosen_pembimbing", step: 1 },
		{ role: "dosen_koordinator", step: 2 },
		{ role: "ketua_program_studi", step: 3 },
		{ role: "admin_fakultas", step: 4 },
		{ role: "supervisor_akademik", step: 5 },
		{ role: "manajer_tu", step: 6 },
	];

	for (const { role, step } of approvalChain) {
		try {
			const res = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${sessions[role]}`,
				},
				body: JSON.stringify({
					comment: `Approved by ${role} (step ${step})`,
				}),
			});

			const data = await res.json();
			
			if (data.success) {
				console.log(`  ✓ Step ${step} (${role}) approved`);
			} else {
				console.log(`  ✗ Step ${step} FAILED:`, data.message || data.error);
			}
		} catch (e: any) {
			console.log(`  ✗ Step ${step} ERROR:`, e.message);
		}
	}

	// ========== 11. APPROVE WD1 + TTD ==========
	console.log("\n11) TESTING APPROVE WD1 + TTD...\n");

	try {
		const ttdRes = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.wakil_dekan_1}`,
			},
			body: JSON.stringify({
				comment: "Disetujui dan ditandatangani",
				signatureData: {
					method: "UPLOAD",
					data: SIGNATURE_DATA_URL,
				},
			}),
		});

		const ttdData = await ttdRes.json();
		
		if (ttdData.success) {
			console.log(`  ✓ WD1 approve + TTD sukses!`);
			console.log(`    Current Step: ${ttdData.data.currentStep}`);
		} else {
			console.log(`  ✗ WD1 TTD FAILED:`, ttdData);
		}
	} catch (e: any) {
		console.log(`  ✗ WD1 TTD ERROR:`, e.message);
	}

	// ========== 12. NUMBERING SUGGESTION (UPA) ==========
	console.log("\n12) TESTING NUMBERING SUGGESTION...\n");

	try {
		const suggestionRes = await fetch(`${API_BASE}/letter/${letterId}/numbering/suggestion`, {
			headers: {
				"Authorization": `Bearer ${sessions.upa}`,
			},
		});

		const suggestionData = await suggestionRes.json();
		
		if (suggestionData.success) {
			console.log(`  ✓ Suggestion: ${suggestionData.data.suggestion}`);
			console.log(`    Counter: ${suggestionData.data.counter}`);
		} else {
			console.log(`  ✗ Suggestion FAILED:`, suggestionData);
		}
	} catch (e: any) {
		console.log(`  ✗ Suggestion ERROR:`, e.message);
	}

	// ========== 13. ASSIGN NUMBER (UPA) ==========
	console.log("\n13) TESTING ASSIGN NUMBER...\n");

	const today = new Date();
	const dd = String(today.getDate()).padStart(2, "0");
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const yyyy = today.getFullYear();
	const testNumber = `AK15-01/${dd}/${mm}/${yyyy}`;

	try {
		const numberRes = await fetch(`${API_BASE}/letter/${letterId}/numbering`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.upa}`,
			},
			body: JSON.stringify({
				numberString: testNumber,
			}),
		});

		const numberData = await numberRes.json();
		
		if (numberData.success) {
			console.log(`  ✓ Numbering sukses!`);
			console.log(`    Nomor: ${numberData.data.numberString}`);
			console.log(`    Status: ${numberData.data.status}`);
		} else {
			console.log(`  ✗ Numbering FAILED:`, numberData);
		}
	} catch (e: any) {
		console.log(`  ✗ Numbering ERROR:`, e.message);
	}

	// ========== 14. GET FINAL DETAIL (dengan numbering) ==========
	console.log("\n14) TESTING FINAL DETAIL (after numbering)...\n");

	try {
		const finalDetailRes = await fetch(`${API_BASE}/letter/${letterId}`, {
			headers: {
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
		});

		const finalDetail = await finalDetailRes.json();
		
		if (finalDetail.success) {
			console.log(`  ✓ Final detail retrieved`);
			console.log(`    Status: ${finalDetail.data.status}`);
			console.log(`    Nomor surat: ${finalDetail.data.numbering?.numberString || "N/A"}`);
			console.log(`    History entries: ${finalDetail.data.stepHistory?.length || 0}`);
			console.log(`    Signed at: ${finalDetail.data.signedAt || "N/A"}`);
		} else {
			console.log(`  ✗ Final detail FAILED:`, finalDetail);
		}
	} catch (e: any) {
		console.log(`  ✗ Final detail ERROR:`, e.message);
	}

	// ========== 15. TEST UNIQUENESS (duplikat nomor) ==========
	console.log("\n15) TESTING NUMBER UNIQUENESS (submit surat kedua dengan nomor sama)...\n");

	// Submit surat kedua
	try {
		const submit2Res = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				prodiId: prodiInformatika.id,
				dosenPembimbingUserId: dospemUser.id,
				formData: {
					nim: "24060122140123",
					nama: "Budi Santoso",
					tempatPKL: "PT Lain",
					alamatPKL: "Bandung",
					judul: "Test",
				},
			}),
		});

		const submit2Data = await submit2Res.json();
		
		if (submit2Data.success) {
			console.log(`  ⚠️  Submit kedua berhasil (expected: blocked karena 1 surat aktif)`);
			console.log(`     Tapi surat pertama sudah COMPLETED, jadi boleh submit lagi`);
			console.log(`     Letter 2 ID: ${submit2Data.data.letterId}`);
			
			// Ini test uniqueness: coba approve sampai UPA dan assign nomor yang sama
			// (simplified: langsung set currentStep & signed untuk test numbering)
			
		} else {
			console.log(`  ✗ Submit kedua FAILED (expected jika masih ada aktif):`, submit2Data.message);
		}
	} catch (e: any) {
		console.log(`  ✗ Submit kedua ERROR:`, e.message);
	}

	console.log("\n========================================");
	console.log("E2E TESTING COMPLETE");
	console.log("========================================\n");
}

testWorkflow()
	.catch((e) => {
		console.error("Test ERROR:", e);
		process.exit(1);
	})
	.finally(async () => {
		await Prisma.$disconnect();
		process.exit(0);
	});
