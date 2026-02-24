import { Prisma } from "@backend/db/index";
import { randomBytes, scryptSync } from "crypto";

import { auth } from "@backend/lib/auth";

async function main() {
	console.log("Starting database seed...");

	const superAdminRole = await Prisma.role.upsert({
		create: {
			name: "superadmin",
		},
		update: {},
		where: {
			name: "superadmin",
		},
	});

	const mahasiswaRole = await Prisma.role.upsert({
		create: {
			name: "mahasiswa",
		},
		update: {},
		where: {
			name: "mahasiswa",
		},
	});

	const supervisorAkademikRole = await Prisma.role.upsert({
		create: {
			name: "supervisor_akademik",
		},
		update: {},
		where: {
			name: "supervisor_akademik",
		},
	});

	const supervisorKemahasiswaanRole = await Prisma.role.upsert({
		create: {
			name: "supervisor_kemahasiswaan",
		},
		update: {},
		where: {
			name: "supervisor_kemahasiswaan",
		},
	});

	const petugasTURole = await Prisma.role.upsert({
		create: {
			name: "petugas_tu",
		},
		update: {},
		where: {
			name: "petugas_tu",
		},
	});

	const dekanRole = await Prisma.role.upsert({
		create: {
			name: "dekan",
		},
		update: {},
		where: {
			name: "dekan",
		},
	});

	const wakilDekan1Role = await Prisma.role.upsert({
		create: {
			name: "wakil_dekan_1",
		},
		update: {},
		where: {
			name: "wakil_dekan_1",
		},
	});

	const wakilDekan2Role = await Prisma.role.upsert({
		create: {
			name: "wakil_dekan_2",
		},
		update: {},
		where: {
			name: "wakil_dekan_2",
		},
	});

	const managerTURole = await Prisma.role.upsert({
		create: {
			name: "manajer_tu",  // Konsistensi dengan kontrak teknis
		},
		update: {},
		where: {
			name: "manajer_tu",
		},
	});

	const petugasAkademikRole = await Prisma.role.upsert({
		create: {
			name: "petugas_akademik",
		},
		update: {},
		where: {
			name: "petugas_akademik",
		},
	});

	const upaRole = await Prisma.role.upsert({
		create: {
			name: "upa",
		},
		update: {},
		where: {
			name: "upa",
		},
	});

	const supervisorSumberdayaRole = await Prisma.role.upsert({
		create: {
			name: "supervisor_sumberdaya",
		},
		update: {},
		where: {
			name: "supervisor_sumberdaya",
		},
	});

	const prodiRole = await Prisma.role.upsert({
		create: {
			name: "prodi",
		},
		update: {},
		where: {
			name: "prodi",
		},
	});

	const dosenPembimbingRole = await Prisma.role.upsert({
		create: {
			name: "dosen_pembimbing",
		},
		update: {},
		where: {
			name: "dosen_pembimbing",
		},
	});

	const dosenKoordinatorRole = await Prisma.role.upsert({
		create: {
			name: "dosen_koordinator",
		},
		update: {},
		where: {
			name: "dosen_koordinator",
		},
	});

	const ketuaProdiRole = await Prisma.role.upsert({
		create: {
			name: "ketua_program_studi",  // Konsistensi dengan kontrak teknis
		},
		update: {},
		where: {
			name: "ketua_program_studi",
		},
	});

	const adminFakultasRole = await Prisma.role.upsert({
		create: {
			name: "admin_fakultas",
		},
		update: {},
		where: {
			name: "admin_fakultas",
		},
	});

	const adminDepartemenRole = await Prisma.role.upsert({
		create: {
			name: "admin_departemen",
		},
		update: {},
		where: {
			name: "admin_departemen",
		},
	});

	const ketuaDepartemenRole = await Prisma.role.upsert({
		create: {
			name: "ketua_departemen",
		},
		update: {},
		where: {
			name: "ketua_departemen",
		},
	});

	const pegawaiUktRole = await Prisma.role.upsert({
		create: {
			name: "pegawai_ukt",
		},
		update: {},
		where: {
			name: "pegawai_ukt",
		},
	});

	console.log("User Upserted");

	// 2. Upsert Permissions (idempotent)
	const permissionData: { resource: string; action: string }[] = [
		{ resource: "departemen", action: "create" },
		{ resource: "departemen", action: "read" },
		{ resource: "departemen", action: "update" },
		{ resource: "departemen", action: "delete" },
		{ resource: "prodi", action: "create" },
		{ resource: "prodi", action: "read" },
		{ resource: "prodi", action: "update" },
		{ resource: "prodi", action: "delete" },
		{ resource: "role", action: "create" },
		{ resource: "role", action: "read" },
		{ resource: "role", action: "update" },
		{ resource: "role", action: "delete" },
		{ resource: "user", action: "create" },
		{ resource: "user", action: "read" },
		{ resource: "user", action: "update" },
		{ resource: "user", action: "delete" },
		{ resource: "letterType", action: "create" },
		{ resource: "letterType", action: "read" },
		{ resource: "letterType", action: "update" },
		{ resource: "letterType", action: "delete" },
		{ resource: "letterTemplate", action: "create" },
		{ resource: "letterTemplate", action: "read" },
		{ resource: "letterTemplate", action: "update" },
		{ resource: "letterTemplate", action: "delete" },
		{ resource: "letter", action: "create" },
		{ resource: "letter", action: "read" },
		{ resource: "letter", action: "update" },
		{ resource: "letter", action: "delete" },
		{ resource: "letter", action: "approve" },
		{ resource: "letter", action: "reject" },
		{ resource: "letter", action: "revise" },
		{ resource: "letter", action: "cancel" },
		{ resource: "letter", action: "file" },
		{ resource: "letter", action: "disposition" },
		{ resource: "letter", action: "forward" },
		{ resource: "letter", action: "editOverlay" },
		{ resource: "letter", action: "numbering" },
		{ resource: "mahasiswa", action: "create" },
		{ resource: "mahasiswa", action: "read" },
		{ resource: "mahasiswa", action: "update" },
		{ resource: "mahasiswa", action: "delete" },
		{ resource: "pegawai", action: "create" },
		{ resource: "pegawai", action: "read" },
		{ resource: "pegawai", action: "update" },
		{ resource: "pegawai", action: "delete" },
	];

	const permissions = await Promise.all(
		permissionData.map(({ resource, action }) =>
			Prisma.permission.upsert({
				where: { resource_action: { resource, action } },
				create: { resource, action },
				update: {},
			}),
		),
	);

	console.log("Permissions upserted");

	await Promise.all(
		permissions.map((permission) =>
			Prisma.rolePermission.upsert({
				where: {
					roleId_permissionId: {
						roleId: superAdminRole.id,
						permissionId: permission.id,
					},
				},
				create: {
					roleId: superAdminRole.id,
					permissionId: permission.id,
				},
				update: {},
			}),
		),
	);

	// Mahasiswa gets letter create and read (idempotent)
	const mahasiswaPerms = permissions.filter((p) =>
		["letter:create", "letter:read"].includes(`${p.resource}:${p.action}`),
	);
	await Promise.all(
		mahasiswaPerms.map((permission) =>
			Prisma.rolePermission.upsert({
				where: {
					roleId_permissionId: {
						roleId: mahasiswaRole.id,
						permissionId: permission.id,
					},
				},
				create: {
					roleId: mahasiswaRole.id,
					permissionId: permission.id,
				},
				update: {},
			}),
		),
	);

	console.log("Assigned permissions to roles");

	const departemenMatematika = await Prisma.departemen.upsert({
		where: {
			code: "fsm_math",
		},
		update: {},
		create: {
			name: "Matematika",
			code: "fsm_math",
		},
	});

	const departemenBiologi = await Prisma.departemen.upsert({
		where: {
			code: "fsm_bio",
		},
		update: {},
		create: {
			name: "Biologi",
			code: "fsm_bio",
		},
	});

	const departemenKimia = await Prisma.departemen.upsert({
		where: {
			code: "fsm_kim",
		},
		update: {},
		create: {
			name: "Kimia",
			code: "fsm_kim",
		},
	});

	const departemenFisika = await Prisma.departemen.upsert({
		where: {
			code: "fsm_fis",
		},
		update: {},
		create: {
			name: "Fisika",
			code: "fsm_fis",
		},
	});

	const departemenStatistika = await Prisma.departemen.upsert({
		where: {
			code: "fsm_statis",
		},
		update: {},
		create: {
			name: "Statistika",
			code: "fsm_statis",
		},
	});

	const departemenInformatika = await Prisma.departemen.upsert({
		where: {
			code: "fsm_if",
		},
		update: {},
		create: {
			name: "Informatika",
			code: "fsm_if",
		},
	});

	const departemenFsm = await Prisma.departemen.upsert({
		where: {
			code: "fsm_main",
		},
		update: {},
		create: {
			name: "FSM",
			code: "fsm_main",
		},
	});

	const prodiInformatika = await Prisma.programStudi.upsert({
		where: {
			code: "240601",
		},
		update: {},
		create: {
			name: "S1 Informatika",
			code: "240601",
			departemenId: departemenInformatika.id,
		},
	});

	const prodiKimia = await Prisma.programStudi.upsert({
		where: {
			code: "240301",
		},
		update: {},
		create: {
			name: "S1 Kimia",
			code: "240301",
			departemenId: departemenKimia.id,
		},
	});

	const prodiFisikaS1 = await Prisma.programStudi.upsert({
		where: {
			code: "240401",
		},
		update: {},
		create: {
			name: "S1 Fisika",
			code: "240401",
			departemenId: departemenFisika.id,
		},
	});

	const prodiFisikaS2 = await Prisma.programStudi.upsert({
		where: {
			code: "240402",
		},
		update: {},
		create: {
			name: "S2 Fisika",
			code: "240402",
			departemenId: departemenFisika.id,
		},
	});

	const prodiMatematikaS1 = await Prisma.programStudi.upsert({
		where: {
			code: "240101",
		},
		update: {},
		create: {
			name: "S1 Matematika",
			code: "240101",
			departemenId: departemenMatematika.id,
		},
	});

	const prodiMatematikaS2 = await Prisma.programStudi.upsert({
		where: {
			code: "240102",
		},
		update: {},
		create: {
			name: "S2 Matematika",
			code: "240102",
			departemenId: departemenMatematika.id,
		},
	});

	const prodiStatistikaS1 = await Prisma.programStudi.upsert({
		where: {
			code: "240503",
		},
		update: {},
		create: {
			name: "S1 Statistika",
			code: "240103",
			departemenId: departemenStatistika.id,
		},
	});

	const prodiBiologiS1 = await Prisma.programStudi.upsert({
		where: {
			code: "240201",
		},
		update: {},
		create: {
			name: "S1 Biologi",
			code: "240201",
			departemenId: departemenBiologi.id,
		},
	});

	const prodiBioteknologiS1 = await Prisma.programStudi.upsert({
		where: {
			code: "240202",
		},
		update: {},
		create: {
			name: "S1 Bioteknologi",
			code: "240202",
			departemenId: departemenBiologi.id,
		},
	});

	const prodiBiologiS2 = await Prisma.programStudi.upsert({
		where: {
			code: "240203",
		},
		update: {},
		create: {
			name: "S2 Biologi",
			code: "240203",
			departemenId: departemenBiologi.id,
		},
	});

	const prodiFSM = await Prisma.programStudi.upsert({
		where: {
			code: "240111",
		},
		update: {},
		create: {
			name: "FSM",
			code: "240111",
			departemenId: departemenFsm.id,
		},
	});

	console.log("Created program studi");

	// Create Users
	const adminUser = await Prisma.user.create({
		data: {
			name: "Admin Sistem",
			email: "admin@university.ac.id",
			emailVerified: true,
		},
	});


	const response = await auth.api.signUpEmail({
		body: {
			email: "superadmin@fsm.internal",
			password: "password1234",
			name: "Admin",
		},
	});

	await Prisma.userRole.create({
		data: {
			userId: response.user.id,
			roleId: superAdminRole.id,
		},
	});

	console.log("Created superadmin user");

	const adminFakultasUser = await auth.api.signUpEmail({
		body: {
			email: "admin.fakultas@fsm.undip.ac.id",
			password: "password1234",
			name: "Budi Admin Fakultas",
		},
	});
	await Prisma.userRole.create({
		data: { userId: adminFakultasUser.user.id, roleId: adminFakultasRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: adminFakultasUser.user.id,
			nip: "199001012020011004",
			jabatan: "Admin Fakultas",
			noHp: "08123456785",
			departemenId: departemenFsm.id,
			programStudiId: prodiFSM.id,
		},
	});

	const supervisorUser = await auth.api.signUpEmail({
		body: {
			email: "supervisor.test@fsm.undip.ac.id",
			password: "password1234",
			name: "Dr. Retno Supervisor",
		},
	});
	await Prisma.userRole.create({
		data: { userId: supervisorUser.user.id, roleId: supervisorAkademikRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: supervisorUser.user.id,
			nip: "198505052015012005",
			jabatan: "Supervisor Akademik",
			noHp: "08123456784",
			departemenId: departemenFsm.id,
			programStudiId: prodiFSM.id,
		},
	});

	const manajerTuUser = await auth.api.signUpEmail({
		body: {
			email: "manajer.tu@fsm.undip.ac.id",
			password: "password1234",
			name: "Siti Manajer TU",
		},
	});
	await Prisma.userRole.create({
		data: { userId: manajerTuUser.user.id, roleId: managerTURole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: manajerTuUser.user.id,
			nip: "199202022020012006",
			jabatan: "Manajer Tata Usaha",
			noHp: "08123456783",
			departemenId: departemenFsm.id,
			programStudiId: prodiFSM.id,
		},
	});

	const wakilDekanUser = await auth.api.signUpEmail({
		body: {
			email: "wakil.dekan1@fsm.undip.ac.id",
			password: "password1234",
			name: "Prof. Dr. Bambang Wakil Dekan",
		},
	});
	await Prisma.userRole.create({
		data: { userId: wakilDekanUser.user.id, roleId: wakilDekan1Role.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: wakilDekanUser.user.id,
			nip: "197001012000011007",
			jabatan: "Wakil Dekan 1",
			noHp: "08123456782",
			departemenId: departemenFsm.id,
			programStudiId: prodiFSM.id,
		},
	});

	const upaUser = await auth.api.signUpEmail({
		body: {
			email: "upa@fsm.undip.ac.id",
			password: "password1234",
			name: "Dewi UPA",
		},
	});
	await Prisma.userRole.create({
		data: { userId: upaUser.user.id, roleId: upaRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: upaUser.user.id,
			nip: "199505052022012008",
			jabatan: "Unit Pengelola Administrasi",
			noHp: "08123456781",
			departemenId: departemenFsm.id,
			programStudiId: prodiFSM.id,
		},
	});

	// ===============================================================================
	// =========================== DATA PRODI INFORMATIKA ============================
	// ===============================================================================

	// 1. Mahasiswa Informatika 1
	const mahasiswaUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.informatika@students.undip.ac.id",
			password: "password1234",
			name: "Budi Santoso",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaUser.user.id,
			nim: "24060122140123",
			tahunMasuk: "2022",
			noHp: "08123456789",
			alamat: "Semarang",
			tempatLahir: "Semarang",
			tanggalLahir: new Date("2004-05-15"),
			departemenId: departemenInformatika.id,
			programStudiId: prodiInformatika.id,
		},
	});

	// 2. Mahasiswa Informatika 2
	const mahasiswaUser2 = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa2.informatika@students.undip.ac.id",
			password: "password1234",
			name: "Siti Aminah",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaUser2.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaUser2.user.id,
			nim: "24060122140124",
			tahunMasuk: "2022",
			noHp: "08123456790",
			alamat: "Semarang",
			tempatLahir: "Semarang",
			tanggalLahir: new Date("2004-06-20"),
			departemenId: departemenInformatika.id,
			programStudiId: prodiInformatika.id,
		},
	});

	// 3. Dospem Informatika
	const dospemUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.informatika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Ahmad Dospem Informatika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemUser.user.id,
			nip: "198701012015011001",
			jabatan: "Dosen Pembimbing",
			noHp: "08123456788",
			departemenId: departemenInformatika.id,
			programStudiId: prodiInformatika.id,
		},
	});

	// 4. Dosen Koordinator Informatika
	const koordinatorUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.informatika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Siti Koordinator Informatika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorUser.user.id,
			nip: "198005052010012002",
			jabatan: "Koordinator PKL",
			noHp: "08123456787",
			departemenId: departemenInformatika.id,
			programStudiId: prodiInformatika.id,
		},
	});

	const kaprodiUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.informatika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Aris Kaprodi Informatika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiUser.user.id,
			nip: "197509092005011003",
			jabatan: "Ketua Program Studi Informatika",
			noHp: "08123456786",
			departemenId: departemenInformatika.id,
			programStudiId: prodiInformatika.id,
		},
	});

    // ===============================================================================
	// ============================= DATA PRODI BIOLOGI ==============================
	// ===============================================================================

	console.log("Creating Biologi workflow users...");

	// 1. Mahasiswa Biologi
	const mahasiswaBioUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.biologi@students.undip.ac.id",
			password: "password1234",
			name: "Rina Amelia",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaBioUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaBioUser.user.id,
			nim: "24020122130099", // Kode 240201 adalah Biologi
			tahunMasuk: "2022",
			noHp: "081299990001",
			alamat: "Tembalang, Semarang",
			tempatLahir: "Surabaya",
			tanggalLahir: new Date("2004-02-02"),
			departemenId: departemenBiologi.id,
			programStudiId: prodiBiologiS1.id,
		},
	});

	// 2. Dosen Pembimbing Biologi
	const dospemBioUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.biologi@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Bambang Biologi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemBioUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemBioUser.user.id,
			nip: "198501012010011099",
			jabatan: "Dosen Pembimbing Biologi",
			noHp: "081299990002",
			departemenId: departemenBiologi.id,
			programStudiId: prodiBiologiS1.id,
		},
	});

	// 3. Dosen Koordinator Biologi
	const koordinatorBioUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.biologi@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Kurnia Koordinator Biologi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorBioUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorBioUser.user.id,
			nip: "197902022005012099",
			jabatan: "Koordinator PKL Biologi",
			noHp: "081299990003",
			departemenId: departemenBiologi.id,
			programStudiId: prodiBiologiS1.id,
		},
	});

	// 4. Kaprodi Biologi
	const kaprodiBioUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.biologi@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Kartini Kaprodi Biologi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiBioUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiBioUser.user.id,
			nip: "197503032000012099",
			jabatan: "Ketua Program Studi Biologi",
			noHp: "081299990004",
			departemenId: departemenBiologi.id,
			programStudiId: prodiBiologiS1.id,
		},
	});

    // ===============================================================================
	// ============================ DATA PRODI MATEMATIKA ============================
	// ===============================================================================

	console.log("Creating Matematika workflow users...");

	// 1. Mahasiswa Matematika
	const mahasiswaMathUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.matematika@students.undip.ac.id",
			password: "password1234",
			name: "Andi Mahardika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaMathUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaMathUser.user.id,
			nim: "24010122130101", // Kode 240101 adalah Matematika
			tahunMasuk: "2022",
			noHp: "081288880001",
			alamat: "Banyumanik, Semarang",
			tempatLahir: "Semarang",
			tanggalLahir: new Date("2004-03-03"),
			departemenId: departemenMatematika.id,
			programStudiId: prodiMatematikaS1.id,
		},
	});

	// 2. Dospem Matematika
	const dospemMathUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.matematika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Budi Matematika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemMathUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemMathUser.user.id,
			nip: "198601012010011101",
			jabatan: "Dosen Pembimbing Matematika",
			noHp: "081288880002",
			departemenId: departemenMatematika.id,
			programStudiId: prodiMatematikaS1.id,
		},
	});

	// 3. Koordinator Matematika
	const koordinatorMathUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.matematika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Citra Koordinator Matematika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorMathUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorMathUser.user.id,
			nip: "198002022005012101",
			jabatan: "Koordinator PKL Matematika",
			noHp: "081288880003",
			departemenId: departemenMatematika.id,
			programStudiId: prodiMatematikaS1.id,
		},
	});

	// 4. Kaprodi Matematika
	const kaprodiMathUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.matematika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Doni Kaprodi Matematika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiMathUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiMathUser.user.id,
			nip: "197603032000012101",
			jabatan: "Ketua Program Studi Matematika",
			noHp: "081288880004",
			departemenId: departemenMatematika.id,
			programStudiId: prodiMatematikaS1.id,
		},
	});

    // ===============================================================================
	// ============================== DATA PRODI KIMIA ===============================
	// ===============================================================================

	console.log("Creating Kimia workflow users...");

	// 1. Mahasiswa Kimia
	const mahasiswaKimiaUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.kimia@students.undip.ac.id",
			password: "password1234",
			name: "Eka Kurnia",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaKimiaUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaKimiaUser.user.id,
			nim: "24030122130102", // Kode 240301 adalah Kimia
			tahunMasuk: "2022",
			noHp: "081277770001",
			alamat: "Pedurungan, Semarang",
			tempatLahir: "Solo",
			tanggalLahir: new Date("2004-04-04"),
			departemenId: departemenKimia.id,
			programStudiId: prodiKimia.id,
		},
	});

	// 2. Dospem Kimia
	const dospemKimiaUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.kimia@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Fajar Kimia",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemKimiaUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemKimiaUser.user.id,
			nip: "198701012010011102",
			jabatan: "Dosen Pembimbing Kimia",
			noHp: "081277770002",
			departemenId: departemenKimia.id,
			programStudiId: prodiKimia.id,
		},
	});

	// 3. Koordinator Kimia
	const koordinatorKimiaUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.kimia@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Gading Koordinator Kimia",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorKimiaUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorKimiaUser.user.id,
			nip: "198102022005012102",
			jabatan: "Koordinator PKL Kimia",
			noHp: "081277770003",
			departemenId: departemenKimia.id,
			programStudiId: prodiKimia.id,
		},
	});

	// 4. Kaprodi Kimia
	const kaprodiKimiaUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.kimia@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Hana Kaprodi Kimia",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiKimiaUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiKimiaUser.user.id,
			nip: "197703032000012102",
			jabatan: "Ketua Program Studi Kimia",
			noHp: "081277770004",
			departemenId: departemenKimia.id,
			programStudiId: prodiKimia.id,
		},
	});

    // ===============================================================================
	// ============================== DATA PRODI FISIKA ==============================
	// ===============================================================================

	console.log("Creating Fisika workflow users...");

	// 1. Mahasiswa Fisika
	const mahasiswaFisikaUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.fisika@students.undip.ac.id",
			password: "password1234",
			name: "Iwan Hermawan",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaFisikaUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaFisikaUser.user.id,
			nim: "24040122130103", // Kode 240401 adalah Fisika
			tahunMasuk: "2022",
			noHp: "081266660001",
			alamat: "Sampangan, Semarang",
			tempatLahir: "Jogja",
			tanggalLahir: new Date("2004-05-05"),
			departemenId: departemenFisika.id,
			programStudiId: prodiFisikaS1.id,
		},
	});

	// 2. Dospem Fisika
	const dospemFisikaUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.fisika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Joko Fisika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemFisikaUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemFisikaUser.user.id,
			nip: "198801012010011103",
			jabatan: "Dosen Pembimbing Fisika",
			noHp: "081266660002",
			departemenId: departemenFisika.id,
			programStudiId: prodiFisikaS1.id,
		},
	});

	// 3. Koordinator Fisika
	const koordinatorFisikaUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.fisika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Kiki Koordinator Fisika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorFisikaUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorFisikaUser.user.id,
			nip: "198202022005012103",
			jabatan: "Koordinator PKL Fisika",
			noHp: "081266660003",
			departemenId: departemenFisika.id,
			programStudiId: prodiFisikaS1.id,
		},
	});

	// 4. Kaprodi Fisika
	const kaprodiFisikaUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.fisika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Limo Kaprodi Fisika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiFisikaUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiFisikaUser.user.id,
			nip: "197803032000012103",
			jabatan: "Ketua Program Studi Fisika",
			noHp: "081266660004",
			departemenId: departemenFisika.id,
			programStudiId: prodiFisikaS1.id,
		},
	});

    // ===============================================================================
	// ============================ DATA PRODI STATISTIKA ============================
	// ===============================================================================

	console.log("Creating Statistika workflow users...");

	// 1. Mahasiswa Statistika
	const mahasiswaStatisUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.statistika@students.undip.ac.id",
			password: "password1234",
			name: "Mona Berlian",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaStatisUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaStatisUser.user.id,
			nim: "24050322130104", // Kode 240503 adalah Statistika
			tahunMasuk: "2022",
			noHp: "081255550001",
			alamat: "Gayamsari, Semarang",
			tempatLahir: "Bandung",
			tanggalLahir: new Date("2004-06-06"),
			departemenId: departemenStatistika.id,
			programStudiId: prodiStatistikaS1.id,
		},
	});

	// 2. Dospem Statistika
	const dospemStatisUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.statis@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Nuri Statistika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemStatisUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemStatisUser.user.id,
			nip: "198901012010011104",
			jabatan: "Dosen Pembimbing Statistika",
			noHp: "081255550002",
			departemenId: departemenStatistika.id,
			programStudiId: prodiStatistikaS1.id,
		},
	});

	// 3. Koordinator Statistika
	const koordinatorStatisUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.statistika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Oki Koordinator Statistika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorStatisUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorStatisUser.user.id,
			nip: "198302022005012104",
			jabatan: "Koordinator PKL Statistika",
			noHp: "081255550003",
			departemenId: departemenStatistika.id,
			programStudiId: prodiStatistikaS1.id,
		},
	});

	// 4. Kaprodi Statistika
	const kaprodiStatisUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.statistika@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Piyu Kaprodi Statistika",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiStatisUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiStatisUser.user.id,
			nip: "197903032000012104",
			jabatan: "Ketua Program Studi Statistika",
			noHp: "081255550004",
			departemenId: departemenStatistika.id,
			programStudiId: prodiStatistikaS1.id,
		},
	});

    // ===============================================================================
	// =========================== DATA PRODI BIOTEKNOLOGI ===========================
	// ===============================================================================

	console.log("Creating Bioteknologi workflow users...");

	// 1. Mahasiswa Bioteknologi
	const mahasiswaBiotekUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.bioteknologi@students.undip.ac.id",
			password: "password1234",
			name: "Qori Bukhori",
		},
	});
	await Prisma.userRole.create({
		data: { userId: mahasiswaBiotekUser.user.id, roleId: mahasiswaRole.id },
	});
	await Prisma.mahasiswa.create({
		data: {
			userId: mahasiswaBiotekUser.user.id,
			nim: "24020222130105", // Kode 240202 adalah Bioteknologi
			tahunMasuk: "2022",
			noHp: "081244440001",
			alamat: "Ngaliyan, Semarang",
			tempatLahir: "Jakarta",
			tanggalLahir: new Date("2004-07-07"),
			departemenId: departemenBiologi.id, // Bioteknologi usually under Biology dept context here
			programStudiId: prodiBioteknologiS1.id,
		},
	});

	// 2. Dospem Bioteknologi
	const dospemBiotekUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.bioteknologi@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Rara Bioteknologi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: dospemBiotekUser.user.id, roleId: dosenPembimbingRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: dospemBiotekUser.user.id,
			nip: "199001012010011105",
			jabatan: "Dosen Pembimbing Bioteknologi",
			noHp: "081244440002",
			departemenId: departemenBiologi.id,
			programStudiId: prodiBioteknologiS1.id,
		},
	});

	// 3. Koordinator Bioteknologi
	const koordinatorBiotekUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.bioteknologi@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Soni Koordinator Bioteknologi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: koordinatorBiotekUser.user.id, roleId: dosenKoordinatorRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: koordinatorBiotekUser.user.id,
			nip: "198402022005012105",
			jabatan: "Koordinator PKL Bioteknologi",
			noHp: "081244440003",
			departemenId: departemenBiologi.id,
			programStudiId: prodiBioteknologiS1.id,
		},
	});

	// 4. Kaprodi Bioteknologi
	const kaprodiBiotekUser = await auth.api.signUpEmail({
		body: {
			email: "kaprodi.bioteknologi@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Tio Kaprodi Bioteknologi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiBiotekUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiBiotekUser.user.id,
			nip: "198003032000012105",
			jabatan: "Ketua Program Studi Bioteknologi",
			noHp: "081244440004",
			departemenId: departemenBiologi.id,
			programStudiId: prodiBioteknologiS1.id,
		},
	});

	console.log("Created sample users for PKL workflow testing");
	console.log("Assigned roles to users");
}

main()
	.catch((e) => {
		console.error("Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await Prisma.$disconnect();
	});