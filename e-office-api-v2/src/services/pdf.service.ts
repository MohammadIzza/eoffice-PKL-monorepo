import puppeteer from "puppeteer";

export class PdfService {
	public static async generatePdfFromHtml(html: string): Promise<Buffer> {
		const browser = await puppeteer.launch({
			headless: "new",
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
			const page = await browser.newPage();
			await page.setContent(html, { waitUntil: "networkidle0" });
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "20mm",
					right: "20mm",
					bottom: "20mm",
					left: "20mm",
				},
			});
			return Buffer.from(pdfBuffer);
		} finally {
			await browser.close();
		}
	}
}
