import { treaty } from "@elysiajs/eden";
import type { App } from "@backend/autogen.routes";

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create Eden Treaty client with proper configuration
export const client = treaty<App>(API_URL, {
	// Enable credentials for cookie-based auth (Better-Auth uses cookies)
	fetch: {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
	},
});

// Error handling helper
export function handleApiError(error: unknown): {
	message: string;
	status?: number;
} {
	if (error instanceof Error) {
		// Try to extract error message from Eden Treaty error
		const errorMessage = error.message || "Terjadi kesalahan";
		
		// Check if it's a network error
		if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
			return {
				message: "Tidak dapat terhubung ke server. Pastikan server berjalan.",
			};
		}
		
		return { message: errorMessage };
	}
	
	return { message: "Terjadi kesalahan yang tidak diketahui" };
}

// Type guard for API responses
export function isApiSuccess<T>(response: unknown): response is { data: T; success?: boolean } {
	return (
		typeof response === "object" &&
		response !== null &&
		"data" in response &&
		(typeof (response as { success?: boolean }).success === "boolean" ||
			!(response as { success?: boolean }).success)
	);
}