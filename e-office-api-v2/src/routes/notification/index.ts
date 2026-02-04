import { Elysia, t } from "elysia";
import { notificationService } from "@backend/services/notification.service";
import { isAuthenticated } from "@backend/middlewares/auth";

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
    .use(isAuthenticated)

    .get("/", async ({ user }) => {
        const [data, unreadCount] = await Promise.all([
            notificationService.getByUser(user.id),
            notificationService.countUnread(user.id),
        ]);

        return {
            status: "success",
            data: {
                notifications: data,
                unreadCount,
            },
        };
    })

    .patch("/:id/read", async ({ params: { id }, user }) => {
        await notificationService.markRead(id, user.id);
        return { status: "success" };
    })

    .patch("/read-all", async ({ user }) => {
        await notificationService.markAllRead(user.id);
        return { status: "success" };
    });

export default notificationRoutes;