// Comprehensive E2E test untuk semua endpoint Phase 2
import { Prisma } from "@backend/db/index.ts";

const API_BASE = "http://localhost:3001";
const SIGNATURE_DATA_URL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8/5+hHgAHggJ/PQ3d1wAAAABJRU5ErkJggg==";

interface TestResult {
	name: string;
	status: "PASS" | "FAIL" | "SKIP";
	message?: string;
	data?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<any>): Promise<void> {
	try {
		const data = await fn();
		results.push({ name, status: "PASS", data });
		console.log(`  ✅ ${name}`);
	} catch (e: any) {
		results.push({ name, status: "FAIL", message: e.message });
		console.log(`  ❌ ${name}: ${e.message}`);
	}
}

async function testAllEndpoints() {
	console.log("========================================");
	console.log("COMPREHENSIVE E2E TEST - ALL ENDPOINTS");
	console.log("========================================\n");

	const sessions: Record<string, string> = {};
	let letterId: string = "";
	let letterId2: string = "";

	// ========== 1. LOGIN ALL USERS ==========
	console.log("1) LOGIN ALL USERS...\n");

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
			const data = await res.json() as { token?: string };
			if (data.token) {
				sessions[user.role] = data.token;
			}
		} catch (e) {
			// Ignore
		}
	}

	const loggedInCount = Object.keys(sessions).length;
	console.log(`  Logged in: ${loggedInCount}/9 users\n`);

	if (loggedInCount < 5) {
		console.log("  ⚠️  WARNING: Server mungkin tidak running. Cek http://localhost:3001\n");
	}

	// ========== 2. GET DATA ==========
	console.log("2) GETTING PRODI & DOSPEM DATA...\n");

	const prodiInformatika = await Prisma.programStudi.findFirst({
		where: { name: "S1 Informatika" },
	});
	const dospemUser = await Prisma.user.findFirst({
		where: { email: "dospem.test@lecturer.undip.ac.id" },
	});

	if (!prodiInformatika || !dospemUser) {
		console.log("  ❌ Prodi atau Dospem tidak ditemukan");
		return;
	}

	console.log(`  ✓ Prodi ID: ${prodiInformatika.id}`);
	console.log(`  ✓ Dospem ID: ${dospemUser.id}\n`);

	// ========== 3. CLEANUP/CREATE SURAT ==========
	console.log("3) PREPARING SURAT...\n");

	// Cek apakah ada surat aktif
	const mahasiswaUser = await Prisma.user.findFirst({
		where: { email: "mahasiswa.test@students.undip.ac.id" },
	});

	const existingLetter = await Prisma.letterInstance.findFirst({
		where: {
			createdById: mahasiswaUser!.id,
			status: "PROCESSING",
		},
		orderBy: { createdAt: "desc" },
	});

	if (existingLetter) {
		console.log(`  ✓ Surat yang sudah ada ditemukan: ${existingLetter.id}`);
		console.log(`    Status: ${existingLetter.status}`);
		console.log(`    Current Step: ${existingLetter.currentStep}`);
		console.log(`    Signed At: ${existingLetter.signedAt || "null"}`);
		
		// Cancel surat yang ada jika belum ditandatangani
		if (!existingLetter.signedAt) {
			console.log("  ✓ Membatalkan surat yang ada untuk membuat surat baru...\n");
			
			await test("POST /letter/:id/cancel (cleanup)", async () => {
				if (!sessions.mahasiswa) {
					throw new Error("Mahasiswa session tidak ada");
				}

				const res = await fetch(`${API_BASE}/letter/${existingLetter.id}/cancel`, {
					method: "POST",
					headers: {
						"Authorization": `Bearer ${sessions.mahasiswa}`,
					},
				});

				if (!res.ok) {
					const text = await res.text();
					throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
				}

				const text = await res.text();
				let data;
				try {
					data = JSON.parse(text);
				} catch {
					throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
				}

				if (!data.success) {
					throw new Error(`Cancel failed: ${data.message || JSON.stringify(data)}`);
				}

				return data;
			});
		} else {
			console.log("  ⚠ Surat sudah ditandatangani, force cancel via database...\n");
			
			// Force cancel via database (untuk test purposes)
			await Prisma.letterInstance.update({
				where: { id: existingLetter.id },
				data: {
					status: "CANCELLED",
					signedAt: null,
					currentStep: null,
				},
			});

			// Record CANCELLED action
			await Prisma.letterStepHistory.create({
				data: {
					letterId: existingLetter.id,
					action: "CANCELLED",
					step: null,
					actorUserId: mahasiswaUser!.id,
					actorRole: "mahasiswa",
					comment: "Force cancel untuk test purposes",
					fromStep: existingLetter.currentStep,
					toStep: null,
				},
			});

			console.log("  ✓ Surat berhasil di-cancel (force)\n");
		}
	}

	// Submit surat baru jika tidak ada surat aktif
	if (!letterId) {
		console.log("  ✓ Submit surat baru...\n");

		await test("POST /letter/pkl/submit", async () => {
			if (!sessions.mahasiswa) {
				throw new Error("Mahasiswa session tidak ada");
			}

			const res = await fetch(`${API_BASE}/letter/pkl/submit`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${sessions.mahasiswa}`,
				},
				body: JSON.stringify({
					prodiId: prodiInformatika.id,
					dosenPembimbingUserId: dospemUser.id,
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

			const text = await res.text();
			let data;
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
			}

			if (!data.success || !data.data?.letterId) {
				throw new Error(`Submit failed: ${data.message || JSON.stringify(data)}`);
			}

			letterId = data.data.letterId;
			return data;
		});
	} else {
		console.log("  ✓ Menggunakan surat yang sudah ada untuk test\n");
	}

	// ========== 4. TEST GET MY LETTERS ==========
	console.log("\n4) TESTING GET MY LETTERS...\n");

	await test("GET /letter/my", async () => {
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/my`, {
			headers: { "Authorization": `Bearer ${sessions.mahasiswa}` },
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || !Array.isArray(data.data)) {
			throw new Error(`Get my letters failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 5. TEST GET DETAIL ==========
	console.log("\n5) TESTING GET DETAIL...\n");

	await test("GET /letter/:id", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId}`, {
			headers: { "Authorization": `Bearer ${sessions.mahasiswa}` },
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || !data.data?.id) {
			throw new Error(`Get detail failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 6. TEST QUEUE ==========
	console.log("\n6) TESTING QUEUE...\n");

	await test("GET /letter/queue?activeRole=dosen_pembimbing", async () => {
		if (!sessions.dosen_pembimbing) throw new Error("Dospem session tidak ada");

		const res = await fetch(`${API_BASE}/letter/queue?activeRole=dosen_pembimbing`, {
			headers: { "Authorization": `Bearer ${sessions.dosen_pembimbing}` },
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || !Array.isArray(data.data)) {
			throw new Error(`Get queue failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 7. TEST APPROVE ==========
	console.log("\n7) TESTING APPROVE...\n");

	// Get letter detail untuk tahu currentStep dan assignee
	const letterDetail = await Prisma.letterInstance.findUnique({
		where: { id: letterId },
	});

	let approveRole = "dosen_pembimbing";
	let approveSession = sessions.dosen_pembimbing;

	if (letterDetail) {
		const currentStep = letterDetail.currentStep;
		const assignedApprovers = letterDetail.assignedApprovers as Record<string, string> | null;
		
		if (currentStep && assignedApprovers) {
			const stepToRoleMap: Record<number, string> = {
				1: "dosen_pembimbing",
				2: "dosen_koordinator",
				3: "ketua_program_studi",
				4: "admin_fakultas",
				5: "supervisor_akademik",
				6: "manajer_tu",
				7: "wakil_dekan_1",
				8: "upa",
			};

			const roleKeyMap: Record<string, string> = {
				dosen_pembimbing: "dospem",
				dosen_koordinator: "koordinator",
				ketua_program_studi: "kaprodi",
				admin_fakultas: "adminFakultas",
				supervisor_akademik: "supervisor",
				manajer_tu: "manajerTu",
				wakil_dekan_1: "wakilDekan1",
				upa: "upa",
			};

			const role = stepToRoleMap[currentStep];
			if (role) {
				approveRole = role;
				const roleKey = roleKeyMap[role] || role;
				const assigneeId = assignedApprovers[roleKey];
				
				// Map role ke session key
				const roleToSessionKey: Record<string, string> = {
					dosen_pembimbing: "dosen_pembimbing",
					dosen_koordinator: "dosen_koordinator",
					ketua_program_studi: "ketua_program_studi",
					admin_fakultas: "admin_fakultas",
					supervisor_akademik: "supervisor_akademik",
					manajer_tu: "manajer_tu",
					wakil_dekan_1: "wakil_dekan_1",
					upa: "upa",
				};

				const sessionKey = roleToSessionKey[role] as keyof typeof sessions;
				approveSession = sessions[sessionKey];
				
				console.log(`  Current Step: ${currentStep} (${role})`);
			}
		}
	}

	await test(`POST /letter/:id/approve (step ${letterDetail?.currentStep || "N/A"})`, async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		
		// Skip jika currentStep null (surat sudah complete atau di state terminal)
		if (!letterDetail?.currentStep) {
			throw new Error(`Skip: Surat sudah complete atau currentStep null (status: ${letterDetail?.status})`);
		}
		
		if (!approveSession) throw new Error(`${approveRole} session tidak ada`);

		const res = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${approveSession}`,
			},
			body: JSON.stringify({
				comment: "Data sudah lengkap dan sesuai, saya setujui",
				...(letterDetail?.currentStep === 7
					? { signatureData: { method: "UPLOAD", data: SIGNATURE_DATA_URL } }
					: {}),
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success) {
			throw new Error(`Approve failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 8. TEST REVISE ==========
	console.log("\n8) TESTING REVISE...\n");

	// Get letter detail lagi untuk currentStep terbaru
	const letterDetailForRevise = await Prisma.letterInstance.findUnique({
		where: { id: letterId },
	});

	let reviseRole = "dosen_koordinator";
	let reviseSession = sessions.dosen_koordinator;

	if (letterDetailForRevise) {
		const currentStep = letterDetailForRevise.currentStep;
		const assignedApprovers = letterDetailForRevise.assignedApprovers as Record<string, string> | null;
		
		if (currentStep && assignedApprovers) {
			const stepToRoleMap: Record<number, string> = {
				1: "dosen_pembimbing",
				2: "dosen_koordinator",
				3: "ketua_program_studi",
				4: "admin_fakultas",
				5: "supervisor_akademik",
				6: "manajer_tu",
				7: "wakil_dekan_1",
				8: "upa",
			};

			const roleKeyMap: Record<string, string> = {
				dosen_pembimbing: "dospem",
				dosen_koordinator: "koordinator",
				ketua_program_studi: "kaprodi",
				admin_fakultas: "adminFakultas",
				supervisor_akademik: "supervisor",
				manajer_tu: "manajerTu",
				wakil_dekan_1: "wakilDekan1",
				upa: "upa",
			};

			const role = stepToRoleMap[currentStep];
			if (role) {
				reviseRole = role;
				const roleToSessionKey: Record<string, string> = {
					dosen_pembimbing: "dosen_pembimbing",
					dosen_koordinator: "dosen_koordinator",
					ketua_program_studi: "ketua_program_studi",
					admin_fakultas: "admin_fakultas",
					supervisor_akademik: "supervisor_akademik",
					manajer_tu: "manajer_tu",
					wakil_dekan_1: "wakil_dekan_1",
					upa: "upa",
				};

				const sessionKey = roleToSessionKey[role] as keyof typeof sessions;
				reviseSession = sessions[sessionKey];
			}
		}
	}

	await test(`POST /letter/:id/revise (step ${letterDetailForRevise?.currentStep || "N/A"})`, async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		
		// Skip jika currentStep null (surat sudah complete atau di state terminal)
		if (!letterDetailForRevise?.currentStep) {
			throw new Error(`Skip: Surat sudah complete atau currentStep null (status: ${letterDetailForRevise?.status})`);
		}
		
		if (!reviseSession) throw new Error(`${reviseRole} session tidak ada`);

		const res = await fetch(`${API_BASE}/letter/${letterId}/revise`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${reviseSession}`,
			},
			body: JSON.stringify({
				comment: "Mohon lengkapi alamat instansi PKL dengan lebih detail",
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success) {
			throw new Error(`Revise failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 9. TEST RESUBMIT ==========
	console.log("\n9) TESTING RESUBMIT...\n");

	await test("POST /letter/:id/resubmit", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId}/resubmit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				formData: {
					nim: "24060122140199",
					nama: "Test User E2E (Updated)",
					tempatPKL: "PT Test E2E",
					alamatPKL: "Jakarta, Jl. Test No. 123 (Updated)",
					judul: "Test E2E System (Updated)",
				},
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success) {
			throw new Error(`Resubmit failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 10. TEST SELF-REVISE ==========
	console.log("\n10) TESTING SELF-REVISE...\n");

	// Re-approve dulu agar bisa self-revise
	if (letterId && sessions.dosen_pembimbing) {
		try {
			await fetch(`${API_BASE}/letter/${letterId}/approve`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
				},
				body: JSON.stringify({ comment: "Re-approve" }),
			});
		} catch (e) {
			// Ignore jika error
		}
	}

	await test("POST /letter/:id/self-revise", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId}/self-revise`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success) {
			throw new Error(`Self-revise failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 11. TEST REJECT ==========
	console.log("\n11) TESTING REJECT...\n");

	// Submit surat kedua untuk test reject
	await test("POST /letter/pkl/submit (surat kedua)", async () => {
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.mahasiswa}`,
			},
			body: JSON.stringify({
				prodiId: prodiInformatika.id,
				dosenPembimbingUserId: dospemUser.id,
				formData: {
					nim: "24060122140200",
					nama: "Test Reject User",
					tempatPKL: "PT Test Reject",
					alamatPKL: "Bandung",
					judul: "Test Reject",
				},
			}),
		});

		const text = await res.text();
		
		// Handle non-JSON response (error message)
		if (!res.ok) {
			// Expected: masih ada surat aktif, jadi submit kedua akan gagal
			// Ini adalah expected behavior: hanya 1 surat aktif per mahasiswa
			if (text.includes("masih memiliki surat PKL yang sedang diproses") || 
			    text.includes("masih memiliki surat") ||
			    text.includes("sedang diproses")) {
				throw new Error(`Skip: ${text.substring(0, 200)} (Expected behavior: hanya 1 surat aktif per mahasiswa)`);
			}
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || !data.data?.letterId) {
			throw new Error(`Submit surat kedua failed: ${data.message || JSON.stringify(data)}`);
		}

		letterId2 = data.data.letterId;
		return data;
	});

	await test("POST /letter/:id/reject", async () => {
		if (!letterId2) {
			// Skip jika submit kedua gagal (masih ada surat aktif)
			throw new Error("Skip: Submit surat kedua gagal karena masih ada surat aktif (expected behavior)");
		}
		if (!sessions.dosen_pembimbing) throw new Error("Dospem session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId2}/reject`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.dosen_pembimbing}`,
			},
			body: JSON.stringify({
				comment: "Data mahasiswa tidak lengkap dan tidak sesuai dengan ketentuan yang berlaku",
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || data.data?.status !== "REJECTED") {
			throw new Error(`Reject failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 12. TEST PREVIEW ==========
	console.log("\n12) TESTING PREVIEW...\n");

	await test("GET /letter/:id/preview", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId}/preview`, {
			headers: { "Authorization": `Bearer ${sessions.mahasiswa}` },
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success) {
			throw new Error(`Preview failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 13. TEST NUMBERING SUGGESTION ==========
	console.log("\n13) TESTING NUMBERING SUGGESTION...\n");

	// Approve chain sampai UPA
	if (letterId) {
		const approvalChain = [
			{ role: "dosen_pembimbing", step: 1 },
			{ role: "dosen_koordinator", step: 2 },
			{ role: "ketua_program_studi", step: 3 },
			{ role: "admin_fakultas", step: 4 },
			{ role: "supervisor_akademik", step: 5 },
			{ role: "manajer_tu", step: 6 },
			{ role: "wakil_dekan_1", step: 7 },
		];

		for (const { role, step } of approvalChain) {
			if (sessions[role]) {
				try {
					await fetch(`${API_BASE}/letter/${letterId}/approve`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${sessions[role]}`,
						},
						body: JSON.stringify({
							comment: `Approved by ${role} (step ${step})`,
							...(step === 7
								? { signatureData: { method: "UPLOAD", data: SIGNATURE_DATA_URL } }
								: {}),
						}),
					});
				} catch (e) {
					// Ignore jika error
				}
			}
		}
	}

	await test("GET /letter/:id/numbering/suggestion", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.upa) throw new Error("UPA session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId}/numbering/suggestion`, {
			headers: { "Authorization": `Bearer ${sessions.upa}` },
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || !data.data?.suggestion) {
			throw new Error(`Numbering suggestion failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 14. TEST NUMBERING ==========
	console.log("\n14) TESTING NUMBERING...\n");

	await test("POST /letter/:id/numbering", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.upa) throw new Error("UPA session tidak ada");

		// Get letter detail untuk cek currentStep
		const letterForNumbering = await Prisma.letterInstance.findUnique({
			where: { id: letterId },
		});

		// Skip jika currentStep bukan 8 (UPA)
		if (letterForNumbering?.currentStep !== 8) {
			throw new Error(`Skip: Penomoran hanya bisa di step 8 (UPA), currentStep: ${letterForNumbering?.currentStep || "null"}`);
		}

		// Get suggestion dulu untuk nomor yang unik
		const suggestionRes = await fetch(`${API_BASE}/letter/${letterId}/numbering/suggestion`, {
			headers: { "Authorization": `Bearer ${sessions.upa}` },
		});

		let numberString = "";
		if (suggestionRes.ok) {
			const suggestionText = await suggestionRes.text();
			try {
				const suggestionData = JSON.parse(suggestionText);
				if (suggestionData.success && suggestionData.data?.suggestion) {
					numberString = suggestionData.data.suggestion;
				}
			} catch {
				// Ignore
			}
		}

		// Fallback ke manual jika suggestion gagal
		if (!numberString) {
			const today = new Date();
			const dd = String(today.getDate()).padStart(2, "0");
			const mm = String(today.getMonth() + 1).padStart(2, "0");
			const yyyy = today.getFullYear();
			// Pakai counter tinggi untuk avoid conflict
			numberString = `AK15-99/${dd}/${mm}/${yyyy}`;
		}

		const res = await fetch(`${API_BASE}/letter/${letterId}/numbering`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${sessions.upa}`,
			},
			body: JSON.stringify({
				numberString: numberString,
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success || data.data?.status !== "COMPLETED") {
			throw new Error(`Numbering failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 15. TEST DOWNLOAD VERSION ==========
	console.log("\n15) TESTING DOWNLOAD VERSION...\n");

	await test("GET /letter/:id/versions/1/download", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");
		if (!sessions.mahasiswa) throw new Error("Mahasiswa session tidak ada");

		const res = await fetch(`${API_BASE}/letter/${letterId}/versions/1/download`, {
			headers: { "Authorization": `Bearer ${sessions.mahasiswa}` },
		});

		if (!res.ok) {
			const text = await res.text();
			// Expected: dokumen belum tersedia (karena belum di-generate)
			if (text.includes("belum tersedia") || text.includes("not available")) {
				throw new Error(`Skip: Dokumen versi 1 belum tersedia (expected - belum di-generate)`);
			}
			throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
		}

		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Response bukan JSON: ${text.substring(0, 200)}`);
		}

		if (!data.success) {
			throw new Error(`Download version failed: ${data.message || JSON.stringify(data)}`);
		}
		return data;
	});

	// ========== 16. VERIFIKASI DI DATABASE ==========
	console.log("\n16) VERIFIKASI DI DATABASE...\n");

	await test("Database verification", async () => {
		if (!letterId) throw new Error("LetterId tidak ada");

		const letterIds = [letterId];
		if (letterId2) letterIds.push(letterId2);

		const letters = await Prisma.letterInstance.findMany({
			where: {
				id: { in: letterIds },
			},
			include: {
				stepHistory: {
					orderBy: { createdAt: "asc" },
				},
				numbering: true,
				attachments: {
					where: { isActive: true },
				},
			},
		});

		const letter1 = letters.find((l) => l.id === letterId);
		
		if (!letter1) {
			throw new Error("Letter1 not found in database");
		}

		// Verify letter1 (bisa PROCESSING atau COMPLETED tergantung state)
		if (!["PROCESSING", "COMPLETED"].includes(letter1.status)) {
			throw new Error(`Letter1 status should be PROCESSING or COMPLETED, got ${letter1.status}`);
		}

		const actions1 = letter1.stepHistory.map((h) => h.action);
		
		// Check minimal required actions (tidak semua harus ada, tergantung state)
		if (!actions1.includes("SUBMITTED")) {
			throw new Error("Letter1 missing SUBMITTED action");
		}
		
		// Check jika sudah ada APPROVED (tidak wajib, tergantung state)
		const hasApproved = actions1.includes("APPROVED");
		const hasNumbered = actions1.includes("NUMBERED");
		const hasNumbering = !!letter1.numbering;
		
		// Jika status COMPLETED, harus ada NUMBERED dan numbering
		if (letter1.status === "COMPLETED") {
			if (!hasNumbered) {
				throw new Error("Letter1 status COMPLETED but missing NUMBERED action");
			}
			if (!hasNumbering) {
				throw new Error("Letter1 status COMPLETED but missing numbering record");
			}
		}
		
		// Jika status PROCESSING, numbering tidak wajib (belum di-step UPA atau belum complete)

		// Verify letter2 (rejected) - hanya jika ada
		let letter2Info = null;
		if (letterId2) {
			const letter2 = letters.find((l) => l.id === letterId2);
			if (letter2) {
				if (letter2.status !== "REJECTED") {
					throw new Error(`Letter2 status should be REJECTED, got ${letter2.status}`);
				}

				const actions2 = letter2.stepHistory.map((h) => h.action);
				if (!actions2.includes("REJECTED")) {
					throw new Error("Letter2 missing REJECTED action");
				}

				letter2Info = {
					status: letter2.status,
					hasRejected: actions2.includes("REJECTED"),
				};
			}
		}

		return {
			letter1: {
				status: letter1.status,
				currentStep: letter1.currentStep,
				hasNumbering: hasNumbering,
				hasNumbered: hasNumbered,
				historyCount: letter1.stepHistory.length,
				hasApproved: hasApproved,
				hasResubmitted: actions1.includes("RESUBMITTED"),
				note: letter1.status === "PROCESSING" ? "Surat masih dalam proses, numbering belum ada (expected)" : "Surat sudah complete",
			},
			letter2: letter2Info || { note: "Letter2 tidak ada (submit kedua gagal karena masih ada surat aktif)" },
		};
	});

	// ========== SUMMARY ==========
	console.log("\n========================================");
	console.log("TEST SUMMARY");
	console.log("========================================\n");

	const passed = results.filter((r) => r.status === "PASS").length;
	const failed = results.filter((r) => r.status === "FAIL").length;
	const total = results.length;

	console.log(`Total Tests: ${total}`);
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

	if (failed > 0) {
		console.log("Failed Tests:");
		results.filter((r) => r.status === "FAIL").forEach((r) => {
			console.log(`  ❌ ${r.name}: ${r.message}`);
		});
	}

	console.log("\n========================================");
	console.log("E2E TEST COMPLETE");
	console.log("========================================\n");
}

testAllEndpoints()
	.catch((e) => {
		console.error("Test ERROR:", e);
		process.exit(1);
	})
	.finally(async () => {
		await Prisma.$disconnect();
		process.exit(0);
	});
