import { Prisma } from "@backend/db/index";
import { auth } from "@backend/lib/auth";
import { MinioService } from "@backend/services/minio.service";
import { determineApproversForPKL } from "@backend/services/workflow/pkl.workflow.service";
import { PKL_WORKFLOW_STEPS, STEP_ROLE_LABEL } from "@backend/services/workflow/pkl.workflow.service";
import { notificationService } from "@backend/services/notification.service";
import path from "node:path";

async function main() {
    console.log("Starting PKL E2E Testing Seeder...");

    const roleMahasiswa = await Prisma.role.findUnique({ where: { name: "mahasiswa" } });
    if (!roleMahasiswa) throw new Error("Role mahasiswa not found");

    const prodiInformatika = await Prisma.programStudi.findUnique({ 
        where: { code: "240601" },
        include: { departemen: true }
    });
    if (!prodiInformatika) throw new Error("S1 Informatika not found");

    const letterTypePKL = await Prisma.letterType.findFirst({ where: { name: "PKL" } });
    if (!letterTypePKL) throw new Error("PKL LetterType not found");

    const dospem = await Prisma.user.findFirst({
        where: { email: "dospem.informatika@lecturer.undip.ac.id" },
        include: { pegawai: true }
    });
    if (!dospem) throw new Error("Dospem Informatika not found");

    console.log("Cleaning up previous test seeds...");
    const testUsers = await Prisma.user.findMany({
        where: { email: { startsWith: "test.mhs" } }
    });
    const testUserIds = testUsers.map(u => u.id);

    if (testUserIds.length > 0) {
        const existingLetters = await Prisma.letterInstance.findMany({
            where: { createdById: { in: testUserIds } },
            select: { id: true },
        });

        const letterIds = existingLetters.map((letter) => letter.id);
        if (letterIds.length > 0) {
            // Delete notifications by letter ID links
            const notificationLinkFilters = letterIds.flatMap((id) => ([
                { link: `/dashboard/surat/${id}` },
                { link: `/dashboard/approval/${id}` },
            ]));

            await Prisma.notification.deleteMany({
                where: {
                    OR: notificationLinkFilters,
                },
            });
            
            // Also delete all notifications sent TO test mahasiswa (any type, any old/new format)
            await Prisma.notification.deleteMany({
                where: {
                    userId: { in: testUserIds }
                },
            });
        }

        // Also delete old-style notifications with raw role names (from previous seeder runs)
        // These are notifications with lowercase_underscore role names instead of formatted titles
        await Prisma.notification.deleteMany({
            where: {
                OR: [
                    { message: { contains: "dosen_pembimbing" } },
                    { message: { contains: "dosen_koordinator" } },
                    { message: { contains: "ketua_program_studi" } },
                    { message: { contains: "admin_fakultas" } },
                    { message: { contains: "supervisor_akademik" } },
                    { message: { contains: "manajer_tu" } },
                    { message: { contains: "wakil_dekan_1" } }
                ]
            }
        });

        await Prisma.mahasiswa.deleteMany({ where: { userId: { in: testUserIds } } });
        await Prisma.userRole.deleteMany({ where: { userId: { in: testUserIds } } });
        await Prisma.attachment.deleteMany({ where: { uploadedByUserId: { in: testUserIds } } });
        await Prisma.letterStepHistory.deleteMany({ where: { actorUserId: { in: testUserIds } } });
        await Prisma.letterInstance.deleteMany({ where: { createdById: { in: testUserIds } } });

        // Also delete from BetterAuth tables if necessary (Session, Account)
        await Prisma.session.deleteMany({ where: { userId: { in: testUserIds } } });
        await Prisma.account.deleteMany({ where: { userId: { in: testUserIds } } });

        await Prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
        console.log(`Wiped ${testUserIds.length} old test profiles.`);
    }

    // Realistic Indonesian names for the 24 dummy students
    const firstNames = ["Agus", "Budi", "Citra", "Dian", "Eko", "Fajar", "Gita", "Hadi", "Intan", "Joko", "Rina", "Siti", "Toni", "Wahyu", "Yudi", "Bambang", "Rini", "Sari", "Dewi", "Indra", "Putra", "Putri", "Surya", "Lestari"];
    const lastNames = ["Santoso", "Wijaya", "Kurniawan", "Pratama", "Sari", "Saputra", "Wahyuni", "Hidayat", "Setiawan", "Nugroho", "Siregar", "Nasution", "Simanjuntak", "Halim", "Aditya"];
    const cities = ["Semarang", "Jakarta", "Surabaya", "Bandung", "Yogyakarta", "Medan", "Malang", "Solo", "Palembang", "Makassar", "Denpasar", "Balikpapan", "Samarinda", "Pontianak", "Manado"];
    const companies = ["PT Telekomunikasi Indonesia", "PT Bank Central Asia", "PT Astra International", "PT Pertamina", "PT PLN (Persero)", "PT Garuda Indonesia", "PT Bank Mandiri", "PT Unilever Indonesia"];
    const addresses = ["Jl. Pahlawan Semarang", "Jl. Sudirman Jakarta", "Jl. Thamrin Jakarta", "Jl. Ahmad Yani Surabaya", "Jl. Gajah Mada Semarang", "Jl. Asia Afrika Bandung"];
    const topics = ["Sistem Informasi Manajemen Data", "Pengembangan Aplikasi Mobile", "Analisis Data dengan Machine Learning", "Pengembangan Website E-Commerce", "Implementasi Internet of Things", "Keamanan Siber dan Enkripsi Data", "Business Intelligence Dashboard"];
    const recipients = ["Bapak Izza Hakiki", "Ibu Retno Wulandari", "Bapak Ahmad Santoso", "Ibu Siti Nurhaliza", "Bapak Bambang Suryanto", "Ibu Dewi Lestari"];
    const positions = ["Kepala HRD", "Manajer IT", "General Manager", "Direktur Operasional", "Kepala Bagian Teknologi", "Manajer Sumber Daya Manusia"];

    // Available signatures from Minio (existing signatures)
    const availableSignatures = [
        "signatures/cmlwlxpgy000711z7xg0u6xcc/signature_cmlwlxpgy000711z7xg0u6xcc_1771695874478_20260221T174434481Z.png",
        "signatures/cmm30d1fg000144rhc6vfo9ee/signature_cmm30d1fg000144rhc6vfo9ee_1772082917672_20260226T051517677Z.png",
        "signatures/cmm38yeca0057f13oqj3t7ekm/signature_cmm38yeca0057f13oqj3t7ekm_1772097924630_20260226T092524635Z.png",
        "signatures/cmmbdscoq000n11jh5efga9wg/signature_cmmbdscoq000n11jh5efga9wg_1772635831372_20260304T145031379Z.png",
        "signatures/cmmbfndue001p11jhcln0d3u1/signature_cmmbfndue001p11jhcln0d3u1_1772600642291_20260304T050402295Z.png",
        "signatures/cmmc5r903000jbjjuz53dvy2v/signature_cmmc5r903000jbjjuz53dvy2v_1772636963265_20260304T150923269Z.png",
    ];

    let studentIndex = 0;

    // Loop through all 8 steps exactly. For each step, create 3 students and 3 pending letters.
    const steps = [
        PKL_WORKFLOW_STEPS.DOSEN_PEMBIMBING,
        PKL_WORKFLOW_STEPS.DOSEN_KOORDINATOR,
        PKL_WORKFLOW_STEPS.KETUA_PROGRAM_STUDI,
        PKL_WORKFLOW_STEPS.ADMIN_FAKULTAS,
        PKL_WORKFLOW_STEPS.SUPERVISOR_AKADEMIK,
        PKL_WORKFLOW_STEPS.MANAJER_TU,
        PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1,
        PKL_WORKFLOW_STEPS.UPA
    ];

    for (const targetStep of steps) {
        console.log(`\n\n=== Seeding 3 letters pending at Step ${targetStep} ===`);

        for (let i = 0; i < 3; i++) {
            const firstName = firstNames[studentIndex % firstNames.length];
            const lastName = lastNames[studentIndex % lastNames.length];
            const fullName = `${firstName} ${lastName}`;
            const nim = `2406012214${String(studentIndex + 1).padStart(3, "0")}`;
            const email = `test.mhs${studentIndex + 1}@students.undip.ac.id`;

            console.log(`\n[${studentIndex + 1}/24] Creating student: ${fullName} (${nim})`);

            // 1. Register User
            const userResponse = await auth.api.signUpEmail({
                body: { email, password: "password1234", name: fullName },
            });
            const userId = userResponse.user.id;

            await Prisma.userRole.create({
                data: { userId, roleId: roleMahasiswa.id },
            });

            // Generate realistic data
            const cityIndex = studentIndex % cities.length;
            const birthYear = 2002 + (studentIndex % 3); // 2002-2004 (age 22-24)
            const birthMonth = 1 + (studentIndex % 12); // 1-12
            const birthDay = 1 + (studentIndex % 28); // 1-28 (safe for all months)
            const ipk = (2.5 + (studentIndex % 15) * 0.1).toFixed(2); // 2.5 - 4.0
            const sks = 80 + (studentIndex % 51); // 80-130

            await Prisma.mahasiswa.create({
                data: {
                    userId,
                    nim,
                    tahunMasuk: "2022",
                    noHp: `0812${Math.floor(Math.random() * 100000000)}`,
                    alamat: `Jl. Pemuda No. ${10 + studentIndex}, ${cities[cityIndex]}`,
                    tempatLahir: cities[cityIndex],
                    tanggalLahir: new Date(birthYear, birthMonth - 1, birthDay),
                    departemenId: prodiInformatika.departemenId,
                    programStudiId: prodiInformatika.id,
                },
            });

            // 2. Determine Approvers
            const assignedApprovers = await determineApproversForPKL(prodiInformatika.id, dospem.id);

            // 4. Get koordinator and kaprodi details
            const koordinatorUser = await Prisma.user.findUnique({
                where: { id: assignedApprovers.koordinator },
                include: { pegawai: true }
            });
            const kaprodiUser = await Prisma.user.findUnique({
                where: { id: assignedApprovers.kaprodi },
                include: { pegawai: true }
            });

            // 5. Prepare signed data for step >= 7
            const signedData: any = {};
            if (targetStep >= 7) {
                // For step 7-8, set signedAt and use existing signature from Minio
                signedData.signedAt = new Date(new Date().getTime() - (24 - targetStep) * 60 * 60 * 1000);
                
                // Pick a random signature from available signatures
                const signatureIndex = studentIndex % availableSignatures.length;
                const fullSignaturePath = availableSignatures[signatureIndex];
                
                // Get presigned URL to the signature (24 hours expiry)
                // Pass full path from bucket root; empty jenis_file means no folder prepending
                const presignedUrl = await MinioService.getPresignedUrl("", fullSignaturePath, 86400);
                signedData.signatureUrl = presignedUrl;
            }

            // 6. Create LetterInstance (Set to targetStep directly to fake the queue)
            const companyIndex = studentIndex % companies.length;
            const addressIndex = studentIndex % addresses.length;
            const topicIndex = studentIndex % topics.length;
            const recipientIndex = studentIndex % recipients.length;
            const positionIndex = studentIndex % positions.length;

            const letter = await Prisma.letterInstance.create({
                data: {
                    letterTypeId: letterTypePKL.id,
                    createdById: userId,
                    schema: {},
                    values: {
                        // Identitas Mahasiswa (Step 1)
                        namaLengkap: fullName,
                        role: "Mahasiswa",
                        nim: nim,
                        email: email,
                        departemen: prodiInformatika.departemen?.name || "Teknik",
                        programStudi: prodiInformatika.name,
                        tempatLahir: cities[cityIndex],
                        tanggalLahir: new Date(birthYear, birthMonth - 1, birthDay).toISOString(),
                        noHp: `0812${Math.floor(Math.random() * 100000000)}`,
                        alamat: `Jl. Pemuda No. ${10 + studentIndex}, ${cities[cityIndex]}`,
                        ipk: ipk,
                        sks: sks.toString(),
                        
                        // Detail Surat (Step 2)
                        jenisSurat: "Surat Pengantar PKL",
                        tujuanSurat: recipients[recipientIndex],
                        jabatan: positions[positionIndex],
                        namaInstansi: companies[companyIndex],
                        alamatInstansi: addresses[addressIndex],
                        judul: `${topics[topicIndex]} - Studi Kasus ${companies[companyIndex]}`,
                        dosenPembimbingId: dospem.id,
                        namaDospem: dospem.name,
                        nipDospem: dospem.pegawai?.nip || "-",
                        namaDosenKoordinator: koordinatorUser?.name || "-",
                        nipDosenKoordinator: koordinatorUser?.pegawai?.nip || "-",
                        namaKaprodi: kaprodiUser?.name || "-",
                        nipKaprodi: kaprodiUser?.pegawai?.nip || "-",
                        
                        // Legacy fields (for backward compatibility)
                        instansi: companies[companyIndex],
                        judulProposal: `${topics[topicIndex]} - Studi Kasus ${companies[companyIndex]}`,
                    },
                    status: "PROCESSING",
                    currentStep: targetStep,
                    assignedApprovers: assignedApprovers,
                    documentVersions: [],  // Will be generated on-the-fly during preview
                    latestEditableVersion: 1,
                    ...signedData,
                },
            });

            // 7. Upload attachments (SETELAH letter created)
            const publicDir = path.join(process.cwd(), "public");
            const attachmentPath = `attachments/${letter.id}/`;
            
            const proposalFile = Bun.file(path.join(publicDir, "PROPOSAL.pdf"));
            const proposalProxy = {
                name: `PROPOSAL_${studentIndex + 1}.pdf`,
                arrayBuffer: async () => await proposalFile.arrayBuffer()
            } as unknown as File;
            const proposalUpload = await MinioService.uploadFile(proposalProxy, attachmentPath, "application/pdf");

            const ktmFile = Bun.file(path.join(publicDir, "KTM.png"));
            const ktmProxy = {
                name: `KTM_${studentIndex + 1}.png`,
                arrayBuffer: async () => await ktmFile.arrayBuffer()
            } as unknown as File;
            const ktmUpload = await MinioService.uploadFile(ktmProxy, attachmentPath, "image/png");

            // 8. Create attachment records
            await Prisma.attachment.createMany({
                data: [
                    { domain: "attachments/", filename: proposalUpload.nameReplace, category: "proposal", letterId: letter.id, uploadedByUserId: userId },
                    { domain: "attachments/", filename: ktmUpload.nameReplace, category: "ktm", letterId: letter.id, uploadedByUserId: userId }
                ]
            });

            // 9. Generate action history leading up to targetStep
            // E.g., if targetStep is 4, we must create SUBMITTED (Mhs), APPROVED (Step 1), APPROVED (Step 2), APPROVED (Step 3).

            let currentDate = new Date();
            currentDate.setHours(currentDate.getHours() - 24); // Start history yesterday

            await Prisma.letterStepHistory.create({
                data: {
                    letterId: letter.id,
                    action: "SUBMITTED",
                    step: null,
                    actorUserId: userId,
                    actorRole: "mahasiswa",
                    toStep: 1,
                    metadata: { assignedApprovers },
                    createdAt: new Date(currentDate.getTime()),
                },
            });

            await notificationService.create(
                userId,
                "Pengajuan Berhasil",
                `Anda telah berhasil mengajukan surat PKL ${fullName}.`,
                `/dashboard/surat/${letter.id}`,
                "SUCCESS",
            );

            const firstApproverId = assignedApprovers["dospem"];
            if (firstApproverId) {
                await notificationService.create(
                    firstApproverId,
                    "Pengajuan Surat Baru",
                    `Mahasiswa ${fullName} mengajukan surat PKL dan menunggu persetujuan Anda.`,
                    `/dashboard/approval/${letter.id}`,
                    "INFO",
                );
            }

            const roleSequence = [
                "dosen_pembimbing",
                "dosen_koordinator",
                "ketua_program_studi",
                "admin_fakultas",
                "supervisor_akademik",
                "manajer_tu",
                "wakil_dekan_1",
                "upa",
            ];
            const actorSequenceKeys = [
                "dospem",
                "koordinator",
                "kaprodi",
                "adminFakultas",
                "supervisor",
                "manajer",
                "wd1",
                "upa",
            ];

            // For step 7 and above, include step 7 in history. Otherwise, go up to targetStep - 1
            const maxHistoricalStep = targetStep >= 7 ? 7 : targetStep - 1;
            for (let historicalStep = 1; historicalStep <= maxHistoricalStep; historicalStep++) {
                currentDate.setHours(currentDate.getHours() + 1); // 1 hour later

                const actorKey = actorSequenceKeys[historicalStep - 1];
                const actorUserId = assignedApprovers[actorKey];

                // Step 7 has special handling: SIGNED then APPROVED
                if (historicalStep === 7) {
                    await Prisma.letterStepHistory.create({
                        data: {
                            letterId: letter.id,
                            action: "SIGNED",
                            step: historicalStep,
                            actorUserId,
                            actorRole: roleSequence[historicalStep - 1],
                            comment: null,
                            fromStep: null,
                            toStep: null,
                            metadata: {
                                signatureUrl: signedData.signatureUrl || null,
                                method: "SEEDED_PLACEHOLDER",
                            },
                            createdAt: new Date(currentDate.getTime()),
                        },
                    });

                    currentDate.setMinutes(currentDate.getMinutes() + 1);
                }

                await Prisma.letterStepHistory.create({
                    data: {
                        letterId: letter.id,
                        action: "APPROVED",
                        step: historicalStep,
                        actorUserId,
                        actorRole: roleSequence[historicalStep - 1],
                        comment: "Disetujui. Lanjutkan sesuai prosedur.",
                        fromStep: historicalStep,
                        toStep: historicalStep + 1,
                        createdAt: new Date(currentDate.getTime()),
                    },
                });

                if (historicalStep === PKL_WORKFLOW_STEPS.WAKIL_DEKAN_1) {
                    await notificationService.create(
                        actorUserId,
                        "Tanda Tangan Berhasil",
                        `Anda telah berhasil melakukan Tanda Tangan pada surat PKL ${fullName}.`,
                        `/dashboard/approval/${letter.id}`,
                        "SUCCESS",
                    );
                } else {
                    await notificationService.create(
                        actorUserId,
                        "Persetujuan Berhasil",
                        `Anda telah berhasil menyetujui surat PKL ${fullName}.`,
                        `/dashboard/approval/${letter.id}`,
                        "SUCCESS",
                    );
                }

                const stepName = STEP_ROLE_LABEL[roleSequence[historicalStep - 1]] || roleSequence[historicalStep - 1];
                if (historicalStep === PKL_WORKFLOW_STEPS.UPA) {
                    await notificationService.create(
                        userId,
                        "Surat PKL Selesai",
                        `Selamat ${fullName}! Surat PKL Anda telah selesai diproses dan disetujui oleh semua pihak.`,
                        `/dashboard/surat/${letter.id}`,
                        "SUCCESS",
                    );
                } else {
                    await notificationService.create(
                        userId,
                        "Status Surat Diperbarui",
                        `Surat PKL ${fullName} telah disetujui pada tahap ${stepName}. Menunggu proses selanjutnya.`,
                        `/dashboard/surat/${letter.id}`,
                        "SUCCESS",
                    );
                }

                if (historicalStep < PKL_WORKFLOW_STEPS.UPA) {
                    const nextStepIndex = historicalStep;
                    const nextApproverKey = actorSequenceKeys[nextStepIndex];
                    const nextApproverId = assignedApprovers[nextApproverKey];
                    if (nextApproverId) {
                        const nextStepName = STEP_ROLE_LABEL[roleSequence[historicalStep]] || roleSequence[historicalStep];
                        await notificationService.create(
                            nextApproverId,
                            "Surat Menunggu Persetujuan Anda",
                            `Surat PKL ${fullName} telah disetujui pada tahap ${stepName}. Sekarang menunggu persetujuan Anda sebagai ${nextStepName}.`,
                            `/dashboard/approval/${letter.id}`,
                            "INFO",
                        );
                    }
                }
            }

            studentIndex++;
        }
    }

    console.log(`\n\n✅ Successfully generated ${studentIndex} testing students and populated the queues of all 8 approver layers.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await Prisma.$disconnect();
    });
