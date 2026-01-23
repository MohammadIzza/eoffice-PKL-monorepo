import { treaty } from "@elysiajs/eden";
import { API_URL } from "./constants";

type App = any;

export const client = treaty<App>(API_URL, {
	fetch: {
		credentials: "include",
	} as any,
}) as any;

export function handleApiError(error: unknown): {
	message: string;
	status?: number;
} {
	// Try to extract error from treaty/elysia error structure
	if (typeof error === 'object' && error !== null) {
		const err = error as any;
		
		// Check for status code
		const status = err.status || err.statusCode || err.response?.status;
		
		// Check for response data (plain text or object)
		if (err.response) {
			// If response is a string (plain text from server)
			if (typeof err.response === 'string') {
				return { message: err.response, status };
			}
			
			// If response has data property
			if (err.response.data !== undefined) {
				if (typeof err.response.data === 'string') {
					return { message: err.response.data, status };
				}
				if (typeof err.response.data === 'object') {
					return { 
						message: err.response.data.message || 
						        err.response.data.error || 
						        err.response.data.toString() ||
						        JSON.stringify(err.response.data),
						status
					};
				}
			}
			
			// Check if response itself has text/body
			if (err.response.text && typeof err.response.text === 'string') {
				return { message: err.response.text, status };
			}
		}
		
		// Check for data property directly
		if (err.data !== undefined) {
			if (typeof err.data === 'string') {
				return { message: err.data, status };
			}
			if (typeof err.data === 'object') {
				return { 
					message: err.data.message || err.data.error || err.data.toString() || JSON.stringify(err.data),
					status
				};
			}
		}
		
		// Check for error property
		if (err.error) {
			if (typeof err.error === 'string') {
				return { message: err.error, status };
			}
			if (typeof err.error === 'object') {
				return { 
					message: err.error.message || err.error.error || err.error.toString() || JSON.stringify(err.error),
					status
				};
			}
		}
		
		// Check for message property
		if (err.message && typeof err.message === 'string') {
			return { message: err.message, status };
		}
	}
	
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