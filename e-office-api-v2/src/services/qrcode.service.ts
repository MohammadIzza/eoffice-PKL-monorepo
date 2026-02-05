import QRCode from "qrcode";

export class QRCodeService {
	/**
	 * Convert text to QR Code Data URL (Base64)
	 */
	public static async generateQRCodeDataURL(text: string): Promise<string> {
		return await QRCode.toDataURL(text, {
			errorCorrectionLevel: "M",
			margin: 0,
			width: 150,
			color: {
				dark: "#000000",
				light: "#ffffff",
			},
		});
	}

	/**
	 * Inject QR Code into HTML string (Bottom Right)
	 */
	public static async injectQRCode(htmlContent: string, trackingUrl: string): Promise<string> {
		const qrCodeDataUrl = await this.generateQRCodeDataURL(trackingUrl);
		
		const qrCodeHtml = `
		<div id="qr-container" style="display: block; width: 100%; text-align: right; margin-top: 30px; clear: both; page-break-inside: avoid;">
			<img src="${qrCodeDataUrl}" alt="QR Check" style="width: 100px; height: 100px;" />
		</div>
		`;
		
		let finalHtml = htmlContent;
		const bodyCloseRegex = /<\/body>/i;
		
		if (bodyCloseRegex.test(htmlContent)) {
			finalHtml = htmlContent.replace(bodyCloseRegex, `${qrCodeHtml}</body>`);
		} else {
			finalHtml = htmlContent + qrCodeHtml;
		}
		
		if (!finalHtml.includes("<html") && !finalHtml.includes("<body")) {
			finalHtml = `<!DOCTYPE html><html><body style="padding: 40px;">${finalHtml}</body></html>`;
		}
		
		return finalHtml;
	}
}
