import { Prisma } from "@backend/db/index.ts";
import type { LetterInstance } from "@backend/db/index.ts";

/**
 * Generate HTML document from letter values
 * Simple template untuk PKL letter
 */
export class DocumentService {
	/**
	 * Generate HTML dari letter values.
	 * overrides.numberString: optional override for "Nomor" (e.g. UPA preview sebelum nomor diterbitkan).
	 */
	public static async generateHTML(
		letter: LetterInstance,
		overrides?: { numberString?: string },
	): Promise<string> {
		const values = letter.values as Record<string, any>;
		const numberDisplay = overrides?.numberString ?? (letter as { numbering?: { numberString?: string } }).numbering?.numberString ?? "-";
		
		// Get dosen pembimbing name if dosenPembimbingId exists
		let dosenPembimbingName = values.dosenPembimbingId || "-";
		if (values.dosenPembimbingId) {
			try {
				const dosen = await Prisma.user.findUnique({
					where: { id: values.dosenPembimbingId },
					select: { name: true },
				});
				if (dosen) {
					dosenPembimbingName = dosen.name;
				}
			} catch (error) {
				console.error("Error fetching dosen pembimbing:", error);
				// Fallback to ID if lookup fails
			}
		}
		
		// Format tanggal Indonesia
		const formatDate = (dateStr: string | null | undefined): string => {
			if (!dateStr) return "-";
			try {
				const date = new Date(dateStr);
				const day = date.getDate().toString().padStart(2, "0");
				const month = (date.getMonth() + 1).toString().padStart(2, "0");
				const year = date.getFullYear();
				return `${day}/${month}/${year}`;
			} catch {
				return dateStr;
			}
		};

		const html = `
<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Surat Pengantar PKL</title>
	<style>
		body {
			font-family: 'Times New Roman', serif;
			font-size: 12pt;
			line-height: 1.6;
			margin: 0;
			padding: 40px;
			color: #000;
		}
		.header {
			text-align: center;
			margin-bottom: 30px;
		}
		.header h1 {
			font-size: 14pt;
			font-weight: bold;
			margin: 0;
			text-transform: uppercase;
		}
		.header p {
			margin: 5px 0;
			font-size: 11pt;
		}
		.content {
			text-align: justify;
			margin: 20px 0;
		}
		.content p {
			margin: 10px 0;
		}
		.signature-section {
			margin-top: 50px;
			display: flex;
			justify-content: space-between;
		}
		.signature-box {
			text-align: center;
			width: 45%;
		}
		.signature-line {
			border-top: 1px solid #000;
			margin-top: 60px;
			padding-top: 5px;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			margin: 15px 0;
		}
		table td {
			padding: 5px 10px;
			vertical-align: top;
		}
		table td:first-child {
			width: 200px;
		}
		@media print {
			body {
				padding: 20px;
			}
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h1>
		<h1>UNIVERSITAS DIPONEGORO</h1>
		<h1>FAKULTAS SAINS DAN MATEMATIKA</h1>
		<p>Jalan Prof. Soedarto, SH., Tembalang, Semarang 50275</p>
		<p>Telepon: (024) 7474754, Faksimile: (024) 76480823</p>
		<p>Website: www.fsm.undip.ac.id, Email: fsm@undip.ac.id</p>
	</div>

	<div class="content">
		<p style="text-align: right; margin-bottom: 30px;">
			Nomor: ${numberDisplay}<br>
			Lampiran: -<br>
			Perihal: ${values.jenisSurat || "Surat Pengantar PKL"}
		</p>

		<p>Kepada Yth.</p>
		<p style="margin-left: 40px;">
			${values.jabatan || "-"}<br>
			${values.namaInstansi || "-"}<br>
			${values.alamatInstansi || "-"}
		</p>

		<p style="margin-top: 20px;">
			Dengan hormat,
		</p>

		<p style="text-align: justify; text-indent: 40px; margin: 20px 0;">
			Dalam rangka pelaksanaan Praktik Kerja Lapangan (PKL), dengan ini kami sampaikan bahwa:
		</p>

		<table>
			<tr>
				<td>Nama</td>
				<td>: ${values.namaLengkap || "-"}</td>
			</tr>
			<tr>
				<td>NIM</td>
				<td>: ${values.nim || "-"}</td>
			</tr>
			<tr>
				<td>Program Studi</td>
				<td>: ${values.programStudi || "-"}</td>
			</tr>
			<tr>
				<td>Departemen</td>
				<td>: ${values.departemen || "-"}</td>
			</tr>
			<tr>
				<td>IPK</td>
				<td>: ${values.ipk || "-"}</td>
			</tr>
			<tr>
				<td>SKS</td>
				<td>: ${values.sks || "-"}</td>
			</tr>
			<tr>
				<td>Judul PKL</td>
				<td>: ${values.judul || "-"}</td>
			</tr>
			<tr>
				<td>Dosen Pembimbing</td>
				<td>: ${dosenPembimbingName}</td>
			</tr>
		</table>

		<p style="text-align: justify; text-indent: 40px; margin: 20px 0;">
			Adalah mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro yang akan melaksanakan 
			Praktik Kerja Lapangan (PKL) di instansi yang Bapak/Ibu pimpin. Sehubungan dengan hal tersebut, 
			kami mohon Bapak/Ibu berkenan memberikan kesempatan kepada mahasiswa tersebut untuk melaksanakan 
			PKL di instansi yang Bapak/Ibu pimpin.
		</p>

		<p style="text-align: justify; text-indent: 40px; margin: 20px 0;">
			Demikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.
		</p>
	</div>

	<div class="signature-section">
		<div class="signature-box">
			<div class="signature-line">
				${letter.signedAt ? `<img src="${letter.signatureUrl || ""}" alt="Signature" style="max-width: 150px; max-height: 60px;">` : ""}
			</div>
		</div>
		<div class="signature-box">
			<p style="margin-top: 60px;">
				Wakil Dekan Bidang Akademik<br>
				Fakultas Sains dan Matematika<br>
				Universitas Diponegoro
			</p>
		</div>
	</div>
</body>
</html>
		`.trim();

		return html;
	}

	/**
	 * Generate HTML dan simpan ke Minio
	 */
	public static async generateAndStoreHTML(
		letter: LetterInstance,
	): Promise<{ storageKey: string; url: string }> {
		const html = await DocumentService.generateHTML(letter);
		
		// Simpan HTML ke Minio
		const { MinioService } = await import("./minio.service.ts");
		const fs = await import("node:fs");
		
		const fileName = `letters/${letter.id}/document_v${letter.latestEditableVersion || 1}.html`;
		const tempFilePath = `./uploads/temp_${letter.id}_${Date.now()}.html`;
		
		// Ensure uploads directory exists
		if (!fs.existsSync("./uploads")) {
			fs.mkdirSync("./uploads", { recursive: true });
		}
		
		fs.writeFileSync(tempFilePath, html, "utf-8");
		
		try {
			// Create File object from temp file
			const fileBuffer = fs.readFileSync(tempFilePath);
			const htmlFile = new File([fileBuffer], `document_${letter.id}.html`, { type: "text/html" });
			
			const result = await MinioService.uploadFile(
				htmlFile,
				`letters/${letter.id}/`,
				"text/html",
			);
			
			// Cleanup temp file
			if (fs.existsSync(tempFilePath)) {
				fs.unlinkSync(tempFilePath);
			}
			
			return {
				storageKey: `letters/${letter.id}/${result.nameReplace}`,
				url: result.url,
			};
		} catch (error) {
			// Cleanup temp file on error
			if (fs.existsSync(tempFilePath)) {
				fs.unlinkSync(tempFilePath);
			}
			throw error;
		}
	}
}
