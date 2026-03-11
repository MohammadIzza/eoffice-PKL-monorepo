import { Client, type ItemBucketMetadata } from "minio";
import fs from "node:fs";
import path from "node:path";
import env from "env-var";

export abstract class MinioService {
	private static _client: Client | null = null;
	private static _bucketName: string | null = null;

	/**
	 * Replace the internal MinIO hostname in a presigned URL with the public endpoint.
	 * Needed because the MinIO client connects via localhost internally, but presigned
	 * URLs must be accessible from browsers using the public IP.
	 */
	public static toPublicUrl(internalUrl: string): string {
		const publicEndpoint = env.get("S3_ENDPOINT").asString();
		if (!publicEndpoint) return internalUrl;
		try {
			const internal = new URL(internalUrl);
			const pub = new URL(publicEndpoint);
			// Replace scheme + host + port with public endpoint
			internal.protocol = pub.protocol;
			internal.hostname = pub.hostname;
			internal.port = pub.port;
			return internal.toString();
		} catch {
			return internalUrl;
		}
	}

	private static get client(): Client {
		if (!MinioService._client) {
			// Prefer S3_ENDPOINT env var, fall back to MINIO_ENDPOINT
			const s3Endpoint = env.get("S3_ENDPOINT").asString();
			let endPoint = env.get("MINIO_ENDPOINT").default("localhost").asString();
			let port = env.get("MINIO_PORT").default(9000).asPortNumber();
			let useSSL = env.get("MINIO_USE_SSL").default("false").asBoolStrict();

			if (s3Endpoint) {
				try {
					const parsed = new URL(s3Endpoint);
					endPoint = parsed.hostname;
					port = parsed.port ? parseInt(parsed.port) : (parsed.protocol === "https:" ? 443 : 9000);
					useSSL = parsed.protocol === "https:";
				} catch {
					// keep defaults
				}
			}

			MinioService._client = new Client({
				endPoint,
				port,
				useSSL,
				accessKey: env.get("S3_ACCESS_KEY").default(env.get("MINIO_ACCESS_KEY").default("minioadmin").asString()).asString(),
				secretKey: env.get("S3_SECRET_KEY").default(env.get("MINIO_SECRET_KEY").default("minioadmin").asString()).asString(),
				region: env.get("MINIO_REGION").default("us-east-1").asString(),
			});
		}
		return MinioService._client;
	}

	private static get bucketName(): string {
		if (!MinioService._bucketName) {
			MinioService._bucketName = env
				.get("S3_BUCKET")
				.default(env.get("MINIO_BUCKET_NAME").default("e-office").asString())
				.asString();
		}
		return MinioService._bucketName;
	}

	private static generateUniqueFileNameWithTimestamp(
		originalName: string,
	): string {
		const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
		const [name, extension] = originalName
			.replace(/\s+/g, "_")
			.split(/\.(?=[^.]+$)/);
		return `${name}_${timestamp}.${extension}`;
	}

	public static async ensureBucket(): Promise<void> {
		const exists = await MinioService.client.bucketExists(
			MinioService.bucketName,
		);

		if (!exists) {
			await MinioService.client.makeBucket(
				MinioService.bucketName,
				env.get("MINIO_REGION").default("us-east-1").asString(),
			);
		}
	}

	public static async listBucket() {
		return await MinioService.client.listBuckets();
	}

	async uploadFileGeneral(
		file: File,
		objectName: string,
		jenis_file: string,
		contentType?: string,
	): Promise<string> {
		const uploadDir = "./uploads";
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		await MinioService.ensureBucket();

		const nameReplace =
			MinioService.generateUniqueFileNameWithTimestamp(objectName);

		const tempFilePath = path.join(uploadDir, file.name);
		const fileBuffer = Buffer.from(await file.arrayBuffer());
		fs.writeFileSync(tempFilePath, fileBuffer);

		let folderBucket = jenis_file || "";
		if (jenis_file === "lampiran") {
			folderBucket = "lampiran/";
		} else if (jenis_file === "signature") {
			folderBucket = "signature/";
		} else {
			folderBucket = "";
		}

		await MinioService.client.fPutObject(
			MinioService.bucketName,
			folderBucket + nameReplace,
			tempFilePath,
			{ "Content-Type": contentType || "application/octet-stream" },
		);

		fs.unlinkSync(tempFilePath);

		const rawUrl = await MinioService.client.presignedUrl(
			"GET",
			MinioService.bucketName,
			folderBucket + nameReplace,
			7 * 24 * 60 * 60,
		);

		return MinioService.toPublicUrl(rawUrl);
	}

	public static async uploadFile(
		file: File,
		category_file: string,
		contentType?: string,
	): Promise<{ url: string; nameReplace: string }> {
		try {
			const uploadDir = "./uploads";

			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true });
			}
			await MinioService.ensureBucket();

			const nameReplace = MinioService.generateUniqueFileNameWithTimestamp(
				file.name,
			);

			const tempFilePath = path.join(uploadDir, file.name);

			const fileBuffer = Buffer.from(await file.arrayBuffer());

			fs.writeFileSync(tempFilePath, fileBuffer);

			await MinioService.client.fPutObject(
				MinioService.bucketName,
				category_file + nameReplace,
				tempFilePath,
				{ "Content-Type": contentType || "application/octet-stream" },
			);

			fs.unlinkSync(tempFilePath);

			const rawUrl = await MinioService.client.presignedUrl(
				"GET",
				MinioService.bucketName,
				category_file + nameReplace,
				7 * 24 * 60 * 60,
			);

			return { url: MinioService.toPublicUrl(rawUrl), nameReplace };
		} catch (error) {
			console.error(" MINIO ERROR:");
			if (error instanceof Error) {
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
				throw new Error(`Minio upload failed: ${error.message}`);
			} else {
				console.error("Unknown error:", error);
				throw new Error(`Minio upload failed: ${String(error)}`);
			}
		}
	}

	public static async downloadFile(
		objectName: string,
		downloadPath: string,
	): Promise<void> {
		await MinioService.client.fGetObject(
			MinioService.bucketName,
			objectName,
			downloadPath,
		);
	}

	public static async getPresignedUrl(
		jenis_file: string,
		objectName: string,
		expirySeconds: number,
	): Promise<string> {
		let folderBucket = "";
		if (jenis_file === "lampiran") {
			folderBucket = "lampiran/";
		} else if (jenis_file === "signature") {
			folderBucket = "signature/";
		} else {
			folderBucket = "";
		}

		const rawUrl = await MinioService.client.presignedUrl(
			"GET",
			MinioService.bucketName,
			folderBucket + objectName,
			expirySeconds,
		);
		return MinioService.toPublicUrl(rawUrl);
	}

	public static async listObjects(prefix = ""): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const objects: string[] = [];
			const stream = MinioService.client.listObjects(
				MinioService.bucketName,
				prefix,
				true,
			);

			stream.on("data", (obj: ItemBucketMetadata) => {
				objects.push(obj.name);
			});

			stream.on("end", () => resolve(objects));
			stream.on("error", (err: any) => reject(err));
		});
	}

	public static async deleteFile(jenis_file: string, objectName: string) {
		let folderBucket = "";
		if (jenis_file === "lampiran") {
			folderBucket = "lampiran/";
		} else if (jenis_file === "signature") {
			folderBucket = "signature/";
		} else {
			folderBucket = "";
		}

		const result = await MinioService.client.removeObject(
			MinioService.bucketName,
			folderBucket + objectName,
		);
		return result;
	}

	public static async getFileStream(location: string) {
		// Get file stat to get metadata (content type, size, etc.)
		const stat = await MinioService.client.statObject(
			MinioService.bucketName,
			location,
		);

		// Get stream
		const stream = await MinioService.client.getObject(
			MinioService.bucketName,
			location,
		);

		return { stat, stream };
	}
}
