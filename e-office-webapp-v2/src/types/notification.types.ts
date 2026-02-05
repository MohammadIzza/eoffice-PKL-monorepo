export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link?: string | null;
    createdAt: string | Date;
    userId: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
}
