import { authGuardPlugin } from "@backend/middlewares/auth";
import { Prisma } from "@backend/db/index";
import { MinioService } from "@backend/services/minio.service";
import { Elysia, t } from "elysia";

export default new Elysia().use(authGuardPlugin).get(
	"/",
	async ({ user }) => {
		const userWithRelations = await Prisma.user.findUnique({
			where: { id: user.id },
			include: {
				userRole: {
					include: {
						role: true,
					},
				},
				mahasiswa: {
					include: {
						programStudi: true,
						departemen: true,
					},
				},
				pegawai: {
					include: {
						programStudi: true,
						departemen: true,
					},
				},
			},
		});

		if (!userWithRelations) {
			return { error: "User not found" };
		}

		return {
			id: userWithRelations.id,
			name: userWithRelations.name,
			email: userWithRelations.email,
			emailVerified: userWithRelations.emailVerified,
			image: userWithRelations.image,
			signatureUrl: userWithRelations.signatureUrl
				? MinioService.toPublicUrl(userWithRelations.signatureUrl)
				: null,
			roles: userWithRelations.userRole.map((ur) => ({
				id: ur.role.id,
				name: ur.role.name,
			})),
			mahasiswa: userWithRelations.mahasiswa
				? {
						id: userWithRelations.mahasiswa.id,
						nim: userWithRelations.mahasiswa.nim,
						tahunMasuk: userWithRelations.mahasiswa.tahunMasuk,
						noHp: userWithRelations.mahasiswa.noHp,
						alamat: userWithRelations.mahasiswa.alamat,
						tempatLahir: userWithRelations.mahasiswa.tempatLahir,
						tanggalLahir: userWithRelations.mahasiswa.tanggalLahir,
						programStudi: userWithRelations.mahasiswa.programStudi
							? {
									id: userWithRelations.mahasiswa.programStudi.id,
									name: userWithRelations.mahasiswa.programStudi.name,
									code: userWithRelations.mahasiswa.programStudi.code,
								}
							: null,
						departemen: userWithRelations.mahasiswa.departemen
							? {
									id: userWithRelations.mahasiswa.departemen.id,
									name: userWithRelations.mahasiswa.departemen.name,
									code: userWithRelations.mahasiswa.departemen.code,
								}
							: null,
					}
				: null,
			pegawai: userWithRelations.pegawai
				? {
						id: userWithRelations.pegawai.id,
						nip: userWithRelations.pegawai.nip,
						jabatan: userWithRelations.pegawai.jabatan,
						noHp: userWithRelations.pegawai.noHp,
						programStudi: userWithRelations.pegawai.programStudi
							? {
									id: userWithRelations.pegawai.programStudi.id,
									name: userWithRelations.pegawai.programStudi.name,
									code: userWithRelations.pegawai.programStudi.code,
								}
							: null,
						departemen: userWithRelations.pegawai.departemen
							? {
									id: userWithRelations.pegawai.departemen.id,
									name: userWithRelations.pegawai.departemen.name,
									code: userWithRelations.pegawai.departemen.code,
								}
							: null,
					}
				: null,
		};
	},
	{},
)
.patch(
		"/",
		async ({ user, body }) => {
			await Prisma.user.update({
				where: { id: user.id },
				data: { name: body.name },
			});

			const mahasiswa = await Prisma.mahasiswa.findUnique({
				where: { userId: user.id },
			});

			if (mahasiswa) {
				await Prisma.mahasiswa.update({
					where: { id: mahasiswa.id },
					data: {
						noHp: body.noHp,
						alamat: body.alamat,
						tempatLahir: body.tempatLahir,
						tanggalLahir: body.tanggalLahir
							? new Date(body.tanggalLahir)
							: undefined,
					},
				});
			}

			const pegawai = await Prisma.pegawai.findUnique({
				where: { userId: user.id },
			});

			if (pegawai) {
				await Prisma.pegawai.update({
					where: { id: pegawai.id },
					data: {
						noHp: body.noHp,
					},
				});
			}

			return { success: true, message: "Profil berhasil diperbarui" };
		},
		{
			body: t.Object({
				name: t.String(),
				noHp: t.Optional(t.String()),
				alamat: t.Optional(t.String()),
				tempatLahir: t.Optional(t.String()),
				tanggalLahir: t.Optional(t.String()),
			}),
		},
	)
	.post("/signature", async ({ user, body }) => {
		const { signatureData } = body;
		const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;
		const ALLOWED_SIGNATURE_MIME = new Set(["image/png", "image/jpeg", "image/jpg"]);

		if (!signatureData || typeof signatureData !== "string") {
			throw new Error("Data tanda tangan tidak valid");
		}

		console.log("Receiving signature upload for user:", user.id);

		const dataUrlMatch = signatureData.match(/^data:(.+);base64,(.+)$/);
		if (!dataUrlMatch) {
			throw new Error("Format tanda tangan tidak valid. Gunakan data URL base64.");
		}

		const mimeType = dataUrlMatch[1];
		if (!ALLOWED_SIGNATURE_MIME.has(mimeType)) {
			throw new Error("Format tanda tangan harus PNG atau JPG");
		}

		const base64Data = dataUrlMatch[2];
		const buffer = Buffer.from(base64Data, "base64");
		
		if (buffer.length > MAX_SIGNATURE_BYTES) {
			throw new Error("Ukuran tanda tangan maksimal 2MB");
		}

		const extension = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" : "png";
		const fileName = `user_sig_${user.id}_${Date.now()}.${extension}`;
		
		const signatureFile = new File([buffer], fileName, { type: mimeType });
		
		try {
			// Upload ke Minio
			const result = await MinioService.uploadFile(
				signatureFile, 
				`users/${user.id}/signature/`, 
				mimeType
			);
			
			// Update URL di database
			await Prisma.user.update({
				where: { id: user.id },
				data: { signatureUrl: result.url }
			});

			return { 
				success: true, 
				message: "Tanda tangan berhasil disimpan", 
				data: { signatureUrl: result.url } 
			};
		} catch (error) {
			console.error("Signature upload failed:", error);
			throw new Error("Gagal menyimpan tanda tangan ke server");
		}
	}, {
		body: t.Object({
			signatureData: t.String(), // Base64 string
		})
	});