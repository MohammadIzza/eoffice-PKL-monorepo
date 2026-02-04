import { useState, useEffect, useCallback } from "react";
import { client, handleApiError } from "@/lib/api";
import { Notification } from "@/types/notification.types";
import { toast } from "sonner";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data, error } = await client .notifications.index.get();

            if (error) throw error;

            if (data && data.status === 'success' && data.data) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = async (id: string, link?: string | null) => {
        try {
            setNotifications(prev => {
                const target = prev.find(n => n.id === id);
                if (target && !target.isRead) {
                    setUnreadCount(prevCount => Math.max(0, prevCount - 1));
                }
                return prev.map(n => n.id === id ? { ...n, isRead: true } : n);
            });

            await client.notifications({ id }).read.patch();

            return !!link;
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            await client.notifications({ path: 'read-all' }).patch();
            toast.success("Semua notifikasi ditandai sudah dibaca");
        } catch (error) {
            const err = handleApiError(error);
            toast.error(err.message);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };
};
