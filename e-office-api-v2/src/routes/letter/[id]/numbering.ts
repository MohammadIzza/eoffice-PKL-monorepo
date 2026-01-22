// Endpoint: Penomoran surat oleh UPA (dengan unique constraint)
import { authGuardPlugin } from "@backend/middlewares/auth.ts";
import { Prisma } from "@backend/db/index.ts";
import {
	validateUserIsAssignee,
	PKL_WORKFLOW_STEPS,
} from "@backend/services/workflow/pkl.workflow.service.ts";
import { Elysia, t } from "elysia";

export default new Elysia()
	.use(authGuardPlugin)
	.get(
		"/suggestion",
		async ({ params: { id }, query }) => {
			const { date } = query;
			const targetDate = date ? new Date(date) : new Date();

			// Get counter terakhir untuk tanggal ini
			const lastNumbering = await Prisma.letterNumbering.findFirst({
				where: {
					letterTypeCode: "AK15",  // PKL
					date: {
						gte: new Date(targetDate.setHours(0, 0, 0, 0)),
						lt: new Date(targetDate.setHours(23, 59, 59, 999)),
					},
				},
				orderBy: {
					counter: "desc",
				},
			});

			const nextCounter = (lastNumbering?.counter || 0) + 1;
			const dd = String(targetDate.getDate()).padStart(2, "0");
			const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
			const yyyy = targetDate.getFullYear();

			const suggestion = `AK15-${String(nextCounter).padStart(2, "0")}/${dd}/${mm}/${yyyy}`;

			return {
				success: true,
				data: {
					suggestion,
					counter: nextCounter,
					date: targetDate,
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			query: t.Object({
				date: t.Optional(t.String()),  // Format: YYYY-MM-DD
			}),
		},
	)
	.post(
		"/",
		async ({ params: { id }, body, user }) => {
			const { numberString, date } = body;

			// 1. Get letter
			const letter = await Prisma.letterInstance.findUnique({
				where: { id },
			});

			if (!letter) {
				throw new Error("Surat tidak ditemukan");
			}

			// 2. Validate: currentStep = UPA
			if (letter.currentStep !== PKL_WORKFLOW_STEPS.UPA) {
				throw new Error("Penomoran hanya bisa dilakukan di step UPA");
			}

			// 3. Validate: user adalah UPA yang di-assign
			validateUserIsAssignee(letter, user.id, PKL_WORKFLOW_STEPS.UPA);

			// 4. Validate: surat sudah ditandatangani
			if (!letter.signedAt) {
				throw new Error("Surat belum ditandatangani, tidak bisa diberi nomor");
			}

			// 5. Parse nomor dan extract counter (untuk insert ke LetterNumbering)
			const targetDate = date ? new Date(date) : new Date();
			// Format: AK15-{counter}/{DD}/{MM}/{YYYY}
			const match = numberString.match(/^AK15-(\d+)\//);
			const counter = match ? Number.parseInt(match[1], 10) : 1;

			// 6. Insert LetterNumbering (unique constraint akan throw error jika duplikat)
			try {
				await Prisma.letterNumbering.create({
					data: {
						letterId: letter.id,
						letterTypeCode: "AK15",
						date: targetDate,
						counter: counter,
						numberString: numberString,
						assignedByUserId: user.id,
					},
				});
			} catch (error: any) {
				if (error.code === "P2002") {
					// Unique constraint violation
					throw new Error(
						`Nomor surat ${numberString} sudah digunakan. Silakan gunakan nomor lain.`,
					);
				}
				throw error;
			}

			// 7. Update letter: status = COMPLETED (terminal)
			await Prisma.letterInstance.update({
				where: { id },
				data: {
					status: "COMPLETED",
				},
			});

			// 8. Record NUMBERED action
			await Prisma.letterStepHistory.create({
				data: {
					letterId: letter.id,
					action: "NUMBERED",
					step: PKL_WORKFLOW_STEPS.UPA,
					actorUserId: user.id,
					actorRole: "upa",
					comment: null,
					metadata: {
						numberString,
						counter,
					},
				},
			});

			return {
				success: true,
				message: "Surat berhasil diberi nomor dan selesai diproses",
				data: {
					letterId: letter.id,
					numberString: numberString,
					status: "COMPLETED",
				},
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				numberString: t.String(),  // "AK15-01/22/01/2026"
				date: t.Optional(t.String()),  // YYYY-MM-DD
			}),
		},
	);
