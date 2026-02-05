import prisma from "@backend/db/index.ts";

export const notificationService = {
    async create(
        userId: string,
        title: string,
        message: string,
        link?: string | null,
        type = "INFO"
    ) {
        return prisma.notification.create({
            data: {
                userId,
                title,
                message,
                link,
                type,
                isRead: false,
            },
        });
    },

    async getByUser(userId: string, limit = 20) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    },

    async countUnread(userId: string) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    },

    async markRead(id: string, userId: string) {
        const notif = await prisma.notification.findUnique({ where: { id } });

        if (!notif || notif.userId !== userId) {
            throw new Error("Notification not found or access denied");
        }

        return prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    },

    async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
}
