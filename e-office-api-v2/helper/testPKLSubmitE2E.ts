import { Prisma } from "../src/db/index.ts";

const API_BASE = process.env.API_URL || "http://localhost:3001";

async function testPKLSubmitE2E() {
	console.log("🧪 Testing PKL Submit & Detail End-to-End...\n");

	try {
		const mahasiswa = await Prisma.user.findFirst({
			where: {
				userRole: {
					some: {
						role: {
							name: "mahasiswa",
						},
					},
				},
			},
			include: {
				mahasiswa: {
					include: {
						programStudi: true,
					},
				},
			},
		});

		if (!mahasiswa || !mahasiswa.mahasiswa) {
			console.error("❌ Tidak ada mahasiswa untuk testing");
			return;
		}

		const prodiId = mahasiswa.mahasiswa.programStudiId;
		if (!prodiId) {
			console.error("❌ Mahasiswa tidak memiliki program studi");
			return;
		}

		const dosenPembimbing = await Prisma.user.findFirst({
			where: {
				userRole: {
					some: {
						role: {
							name: "dosen_pembimbing",
						},
					},
				},
				pegawai: {
					programStudiId: prodiId,
				},
			},
		});

		if (!dosenPembimbing) {
			console.error("❌ Tidak ada dosen pembimbing untuk prodi ini");
			return;
		}

		const prodiStaff = await Prisma.pegawai.findMany({
			where: {
				programStudiId: prodiId,
			},
			include: {
				user: {
					include: {
						userRole: {
							include: { role: true },
						},
					},
				},
			},
		});

		const koordinator = prodiStaff.find((p) =>
			p.user.userRole.some((ur) => ur.role.name === "dosen_koordinator"),
		);
		const kaprodi = prodiStaff.find((p) =>
			p.user.userRole.some((ur) => ur.role.name === "ketua_program_studi"),
		);

		if (!koordinator || !kaprodi) {
			console.error("❌ Koordinator atau Kaprodi belum ditentukan");
			return;
		}

		console.log("✅ Data untuk testing:");
		console.log(`   - Mahasiswa: ${mahasiswa.name} (${mahasiswa.mahasiswa.nim})`);
		console.log(`   - Prodi: ${mahasiswa.mahasiswa.programStudi?.name}`);
		console.log(`   - Dosen Pembimbing: ${dosenPembimbing.name}`);
		console.log(`   - Koordinator: ${koordinator.user.name}`);
		console.log(`   - Kaprodi: ${kaprodi.user.name}\n`);

		const loginResponse = await fetch(`${API_BASE}/public/sign-in`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: mahasiswa.email,
				password: "password123",
			}),
		});

		if (!loginResponse.ok) {
			const errorText = await loginResponse.text();
			console.error(`❌ Login failed: ${loginResponse.status} - ${errorText}`);
			return;
		}

		const loginData = await loginResponse.json();
		const cookies = loginResponse.headers.get("set-cookie") || "";
		const sessionToken = cookies.match(/better-auth\.session_token=([^;]+)/)?.[1];

		if (!sessionToken) {
			console.error("❌ Session token tidak ditemukan");
			return;
		}

		console.log("✅ Login berhasil\n");

		const existingLetters = await Prisma.letterInstance.findMany({
			where: {
				createdById: mahasiswa.id,
				status: {
					in: ["PROCESSING", "PENDING", "REVISION"],
				},
			},
		});

		if (existingLetters.length > 0) {
			console.log(`⚠️  Membatalkan ${existingLetters.length} surat aktif yang ada...`);
			for (const letter of existingLetters) {
				await Prisma.letterInstance.update({
					where: { id: letter.id },
					data: { status: "CANCELLED" },
				});
			}
			console.log("✅ Surat aktif dibatalkan\n");
		}

		const formData = {
			namaLengkap: mahasiswa.name,
			role: "Mahasiswa",
			nim: mahasiswa.mahasiswa.nim,
			email: mahasiswa.email,
			departemen: mahasiswa.mahasiswa.departemen?.name || "Informatika",
			programStudi: mahasiswa.mahasiswa.programStudi?.name || "",
			tempatLahir: mahasiswa.mahasiswa.tempatLahir || "Semarang",
			tanggalLahir: mahasiswa.mahasiswa.tanggalLahir || "2000-01-01",
			noHp: mahasiswa.mahasiswa.noHp || "081234567890",
			alamat: mahasiswa.mahasiswa.alamat || "Semarang",
			ipk: "3.85",
			sks: "105",
			jenisSurat: "Surat Pengantar PKL",
			tujuanSurat: "Pimp. HRD PT XYZ",
			jabatan: "Manajer",
			namaInstansi: "PT XYZ",
			alamatInstansi: "Semarang",
			judul: "Analisis Sistem Informasi Persediaan Barang di PT XYZ",
			dosenPembimbingId: dosenPembimbing.id,
			namaDosenKoordinator: koordinator.user.name,
			nipDosenKoordinator: koordinator.nip || "1234567890",
			namaKaprodi: kaprodi.user.name,
			nipKaprodi: kaprodi.nip || "0987654321",
		};

		console.log("📤 Mengajukan surat PKL...");
		const submitResponse = await fetch(`${API_BASE}/letter/pkl/submit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: `better-auth.session_token=${sessionToken}`,
			},
			body: JSON.stringify({
				prodiId: prodiId,
				dosenPembimbingUserId: dosenPembimbing.id,
				formData: formData,
			}),
		});

		if (!submitResponse.ok) {
			const errorText = await submitResponse.text();
			console.error(`❌ Submit failed: ${submitResponse.status} - ${errorText}`);
			return;
		}

		const submitData = await submitResponse.json();
		const letterId = submitData.data?.letterId;

		if (!letterId) {
			console.error("❌ Letter ID tidak ditemukan dalam response");
			console.error("Response:", JSON.stringify(submitData, null, 2));
			return;
		}

		console.log(`✅ Surat berhasil diajukan! Letter ID: ${letterId}\n`);

		console.log("📥 Mengambil detail surat...");
		const detailResponse = await fetch(`${API_BASE}/letter/${letterId}`, {
			method: "GET",
			headers: {
				Cookie: `better-auth.session_token=${sessionToken}`,
			},
		});

		if (!detailResponse.ok) {
			const errorText = await detailResponse.text();
			console.error(`❌ Get detail failed: ${detailResponse.status} - ${errorText}`);
			return;
		}

		const detailData = await detailResponse.json();

		if (!detailData.success || !detailData.data) {
			console.error("❌ Invalid response dari get detail");
			console.error("Response:", JSON.stringify(detailData, null, 2));
			return;
		}

		const letter = detailData.data;

		console.log("✅ Detail surat berhasil diambil!\n");
		console.log("📋 Detail Surat:");
		console.log(`   - ID: ${letter.id}`);
		console.log(`   - Status: ${letter.status}`);
		console.log(`   - Current Step: ${letter.currentStep}`);
		console.log(`   - Letter Type: ${letter.letterType?.name || "N/A"}`);
		console.log(`   - Created By: ${letter.createdBy?.name || "N/A"}`);
		console.log(`   - Step History: ${letter.stepHistory?.length || 0} entries`);
		console.log(`   - Attachments: ${letter.attachments?.length || 0} files`);

		if (letter.values) {
			console.log("\n📝 Form Data:");
			console.log(`   - Nama: ${letter.values.namaLengkap || "N/A"}`);
			console.log(`   - NIM: ${letter.values.nim || "N/A"}`);
			console.log(`   - Judul: ${letter.values.judul || "N/A"}`);
			console.log(`   - Dosen Pembimbing ID: ${letter.values.dosenPembimbingId || "N/A"}`);
			console.log(`   - Koordinator: ${letter.values.namaDosenKoordinator || "N/A"}`);
			console.log(`   - Kaprodi: ${letter.values.namaKaprodi || "N/A"}`);
		}

		if (letter.stepHistory && letter.stepHistory.length > 0) {
			console.log("\n📜 Step History:");
			letter.stepHistory.forEach((history: any, index: number) => {
				console.log(
					`   ${index + 1}. ${history.action} - ${history.actor?.name || history.actorRole} (${new Date(history.createdAt).toLocaleString("id-ID")})`,
				);
			});
		}

		console.log("\n✅ End-to-End Test PASSED!");
	} catch (error) {
		console.error("❌ Error:", error);
		if (error instanceof Error) {
			console.error("   Message:", error.message);
			console.error("   Stack:", error.stack);
		}
	} finally {
		await Prisma.$disconnect();
	}
}

testPKLSubmitE2E();
