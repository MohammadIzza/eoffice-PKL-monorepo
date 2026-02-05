// Script Automation: Mahasiswa Submit -> ... -> Manajer TU Approve
import { Prisma } from "@backend/db/index.ts";

const API_BASE = "http://localhost:3001";

async function step(name: string, fn: () => Promise<any>): Promise<any> {
    try {
        const data = await fn();
        console.log(`  ✅ ${name}`);
        return data;
    } catch (e: any) {
        console.log(`  ❌ ${name}: ${e.message}`);
        throw e;
    }
}

async function autoFillWorkflow() {
    console.log("========================================");
    console.log("AUTOMATION - MAHASISWA TO MANAJER TU");
    console.log("========================================\n");

    const sessions: Record<string, string> = {};
    let letterId: string = "";

    // 1. CONFIGURATION: USERS & ROLES
    const users = [
        { email: "mahasiswa.test@students.undip.ac.id", password: "password1234", role: "mahasiswa" },
        { email: "dospem.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_pembimbing" },
        { email: "koordinator.test@lecturer.undip.ac.id", password: "password1234", role: "dosen_koordinator" },
        { email: "kaprodi.test@lecturer.undip.ac.id", password: "password1234", role: "ketua_program_studi" },
        { email: "admin.fakultas@fsm.undip.ac.id", password: "password1234", role: "admin_fakultas" },
        { email: "supervisor.test@fsm.undip.ac.id", password: "password1234", role: "supervisor_akademik" },
        { email: "manajer.tu@fsm.undip.ac.id", password: "password1234", role: "manajer_tu" },
    ];

    // 2. LOGIN ALL USERS
    console.log("1) LOGIN ALL USERS...\n");
    for (const user of users) {
        try {
            const res = await fetch(`${API_BASE}/public/sign-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user.email, password: user.password }),
            });
            const data: any = await res.json();
            if (data.token) {
                sessions[user.role] = data.token;
            } else {
                console.error(`Failed to login ${user.role} (${user.email}):`, data);
            }
        } catch (e) {
            console.error(`Error logging in ${user.role}:`, e);
        }
    }
    console.log(`  Logged in: ${Object.keys(sessions).length}/${users.length} users\n`);

    // 3. CLEANUP PREVIOUS SESSIONS (CANCEL ACTIVE LETTERS)
    console.log("2) CLEANUP - Cancel active letters for Mahasiswa...\n");
    const mahasiswaUser = await Prisma.user.findFirst({
        where: { email: "mahasiswa.test@students.undip.ac.id" },
    });

    if (mahasiswaUser) {
        const activeLetters = await Prisma.letterInstance.findMany({
            where: {
                createdById: mahasiswaUser.id,
                status: "PROCESSING",
            },
        });

        for (const letter of activeLetters) {
            await Prisma.letterInstance.update({
                where: { id: letter.id },
                data: { status: "CANCELLED" },
            });
            console.log(`  ✓ Canceled letter: ${letter.id}`);
        }
    }

    // 4. PREPARE DATA
    const prodiInformatika = await Prisma.programStudi.findFirst({
        where: { name: "S1 Informatika" },
    });
    const dospemUser = await Prisma.user.findFirst({
        where: { email: "dospem.test@lecturer.undip.ac.id" },
    });

    if (!prodiInformatika || !dospemUser) {
        console.error("  ❌ Data Requirement Missing (Prodi/Dospem)");
        process.exit(1);
    }

    // 5. SUBMIT LETTER
    console.log("\n3) SUBMIT LETTER (Mahasiswa)...\n");
    await step("Submit PKL Letter", async () => {
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
                    nama: "Mahasiswa Tester",
                    email: "mahasiswa.test@students.undip.ac.id",
                    departemen: "Informatika",
                    programStudi: "S1 Informatika",
                    dosenPembimbingId: dospemUser.id,
                    tempatPKL: "PT Teknologi Informasi Indonesia",
                    alamatPKL: "Jl. Sudirman No. 45, Jakarta Selatan",
                    judul: "Pengembangan Sistem Informasi Manajemen Magang Berbasis Web",
                    durasiPKL: "3 Bulan"
                },
            }),
        });
        
        const data: any = await res.json();
        if (!data.success) throw new Error(data.message);
        letterId = data.data.letterId;
        return data;
    });

    // 6. UPLOAD ATTACHMENTS (MANDATORY STEPS)
    console.log("\n4) UPLOAD ATTACHMENTS...\n");
    await step("Upload Dummy Attachments (Proposal & KTM)", async () => {
        // Dummy Files
        const formDataProp = new FormData();
        formDataProp.append("files", new File([new Uint8Array(10)], "proposal.pdf", { type: "application/pdf" })); 
        formDataProp.append("category", "proposal");
        
        await fetch(`${API_BASE}/letter/${letterId}/attachments`, {
            method: "POST",
            headers: { Authorization: `Bearer ${sessions.mahasiswa}` },
            body: formDataProp,
        });

        const formDataKtm = new FormData();
        formDataKtm.append("files", new File([new Uint8Array(10)], "ktm.pdf", { type: "application/pdf" }));
        formDataKtm.append("category", "ktm");

        await fetch(`${API_BASE}/letter/${letterId}/attachments`, {
            method: "POST",
            headers: { Authorization: `Bearer ${sessions.mahasiswa}` },
            body: formDataKtm,
        });
        
        return { uploaded: true };
    });

    // 7. APPROVAL FLOW
    console.log("\n5) APPROVAL PROCESS (Up to Manajer TU)...\n");
    
    // Urutan Approval sesuai flow dokumen
    const approvalSteps = [
        { role: "dosen_pembimbing", label: "Dosen Pembimbing" },
        { role: "dosen_koordinator", label: "Koordinator" },
        { role: "ketua_program_studi", label: "Kaprodi" },
        { role: "admin_fakultas", label: "Admin Fakultas" },
        { role: "supervisor_akademik", label: "Supervisor Akademik" },
        { role: "manajer_tu", label: "Manajer TU" },
    ];

    for (const stepInfo of approvalSteps) {
        if (!sessions[stepInfo.role]) {
            console.log(`  ⚠️ Skipping ${stepInfo.label} (Login failed / No session)`);
            continue;
        }

        await step(`Approve by ${stepInfo.label}`, async () => {
            const res = await fetch(`${API_BASE}/letter/${letterId}/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessions[stepInfo.role]}`,
                },
                body: JSON.stringify({
                    comment: `Approve otomatis via Script (${stepInfo.label})`,
                }), // Disesuaikan dengan body yang diharapkan endpoint approve
            });
            
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (!data.success) throw new Error(data.message || "Approval failed");
                return data;
            } catch (e: any) {
                console.error("SERVER RESPONSE:", text);
                throw new Error(`Failed to parse response: ${e.message}`);
            }
        });
    }

    console.log("\n✅ AUTOMATION FINISHED: Letter is now at step after Manajer TU.");
    console.log(`Letter ID: ${letterId}`);
}

autoFillWorkflow()
    .catch((e) => {
        console.error("\n❌ FAILED TO EXECUTE WORKFLOW");
        console.error(e);
        process.exit(1);
    })
    .then(() => {
        process.exit(0);
    });
