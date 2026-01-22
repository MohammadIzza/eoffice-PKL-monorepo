import { treaty } from "@elysiajs/eden";
import { API_URL } from "./constants";

type App = any;

export const client = treaty<App>(API_URL, {
	fetch: {
		credentials: "include",
	} as any,
});

export function handleApiError(error: unknown): {
	message: string;
	status?: number;
} {
	if (error instanceof Error) {
		const errorMessage = error.message || "Terjadi kesalahan";
		if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
			return {
				message: "Tidak dapat terhubung ke server. Pastikan server berjalan.",
			};
		}
		
		return { message: errorMessage };
	}
	
	return { message: "Terjadi kesalahan yang tidak diketahui" };
}