import { Prisma } from "@backend/db/index.ts";
import { randomBytes, scryptSync } from "crypto";

import { auth } from "@backend/lib/auth.ts";

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

	// ========== CREATE SAMPLE USERS FOR PKL WORKFLOW TESTING ==========

	// 1. Mahasiswa (S1 Informatika)
	const mahasiswaUser = await auth.api.signUpEmail({
		body: {
			email: "mahasiswa.test@students.undip.ac.id",
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

	const dospemUser = await auth.api.signUpEmail({
		body: {
			email: "dospem.test@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Ahmad Dospem",
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

	const koordinatorUser = await auth.api.signUpEmail({
		body: {
			email: "koordinator.test@lecturer.undip.ac.id",
			password: "password1234",
			name: "Prof. Siti Koordinator",
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
			email: "kaprodi.test@lecturer.undip.ac.id",
			password: "password1234",
			name: "Dr. Aris Kaprodi",
		},
	});
	await Prisma.userRole.create({
		data: { userId: kaprodiUser.user.id, roleId: ketuaProdiRole.id },
	});
	await Prisma.pegawai.create({
		data: {
			userId: kaprodiUser.user.id,
			nip: "197509092005011003",
			jabatan: "Ketua Program Studi",
			noHp: "08123456786",
			departemenId: departemenInformatika.id,
			programStudiId: prodiInformatika.id,
		},
	});

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
