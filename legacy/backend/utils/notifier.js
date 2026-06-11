const Notification = require('../models/Notification');

/**
 * Sends a notification to a specific user via Database and Socket.io
 */
const notifyUser = async (app, userId, data) => {
    try {
        const { title, message, type, relatedId } = data;

        // 1. Create DB Record
        const notif = await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId,
            isRead: false
        });

        // 2. Emit Socket Event
        const io = app.get('io');
        if (io) {
            io.emit('new_notification', notif); // Broadcast to all, frontend filters by user or use rooms
            // Better: use rooms if implemented, but for now simple broadcast works with client-side filtering
            // or we can use io.to(socketId).emit(...) if we tracked socket IDs carefully.
            // Current notifications.js joins a room with user.id, so we should use that.
            io.to(String(userId)).emit('new_notification', notif);
        }

        return notif;
    } catch (err) {
        console.error('Notification Error:', err);
    }
};

module.exports = { notifyUser };
