require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');
const bcrypt     = require('bcrypt');
const { Op }     = require('sequelize');
const sequelize  = require('./config/db');
const fs         = require('fs');

// Models
const User       = require('./models/User');
const Task       = require('./models/Task');
const Message    = require('./models/Message');
const Attendance = require('./models/Attendance');
const Ticket     = require('./models/Ticket');
const TicketComment = require('./models/TicketComment');
const TicketAttachment = require('./models/TicketAttachment');
const TicketHistory = require('./models/TicketHistory');
const LeaveRequest = require('./models/LeaveRequest');
const Notification = require('./models/Notification');
const TicketShare = require('./models/TicketShare');
const Group        = require('./models/Group');
const GroupMember  = require('./models/GroupMember');
const UndertakingAsset = require('./models/UndertakingAsset');
const TodoItem = require('./models/TodoItem');
const EmployeeDocument = require('./models/EmployeeDocument');
const Reminder = require('./models/Reminder');

// Associations
Ticket.belongsTo(User, { as: 'Creator', foreignKey: 'creatorId' });
Ticket.belongsTo(User, { as: 'Assignee', foreignKey: 'currentAssigneeId' });
Ticket.hasMany(TicketComment, { foreignKey: 'ticketId' });
Ticket.hasMany(TicketAttachment, { foreignKey: 'ticketId' });
Ticket.hasMany(TicketHistory, { foreignKey: 'ticketId' });
TicketComment.belongsTo(User, { foreignKey: 'userId' });
TicketAttachment.belongsTo(User, { foreignKey: 'userId' });
TicketHistory.belongsTo(User, { foreignKey: 'userId' });
TicketHistory.belongsTo(Ticket, { foreignKey: 'ticketId' });

// Advanced Ticket Sharing
Ticket.hasMany(TicketShare, { foreignKey: 'ticketId' });
TicketShare.belongsTo(User, { foreignKey: 'userId' });
TicketShare.belongsTo(Ticket, { foreignKey: 'ticketId' });

// Todo Associations
TodoItem.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// Reminder Associations
Reminder.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// Group Associations
Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'Members' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });
GroupMember.belongsTo(User, { foreignKey: 'userId', targetKey: 'employeeId' });
User.hasMany(GroupMember, { foreignKey: 'userId', sourceKey: 'employeeId' });
Group.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy', targetKey: 'employeeId' });

// Message Associations
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId', targetKey: 'employeeId' });

const { protect } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// Make io accessible in routes
app.set('io', io);

// Database Sync & Seed
(async () => {
    try {
        if (sequelize.getDialect() === 'sqlite') {
            await sequelize.query('PRAGMA foreign_keys = OFF;');
            await sequelize.sync({ alter: true });
            await sequelize.query('PRAGMA foreign_keys = ON;');
        } else {
            // Drop Messages table to fix type mismatch (senderId was integer, now string)
            await sequelize.query('DROP TABLE IF EXISTS "Messages" CASCADE;');
            await sequelize.sync({ alter: true });
        }
        console.log('📦 Database Cleaned & Synced (Secure Mode)');

    const seedUsers = [
        { id: 'EXO-001', name: 'Chairman', email: 'chairman@exo.com', role: 'Chairman', phone: '+910000000001' },
        { id: 'EXO-002', name: 'CEO', email: 'ceo@exo.com', role: 'CEO', phone: '+910000000002' },
        { id: 'EXO-201', name: 'HR Manager', email: 'hr@exo.com', role: 'HR', phone: '+910000000003' },
        { id: 'EXO-101', name: 'IT Admin', email: 'admin@exo.com', role: 'IT Admin', phone: '+918320069638' },
        { id: 'EXO-1001', name: 'Employee', email: 'employee1001@exo.com', role: 'Employee', phone: '+910000000004' }
    ];

    for (const u of seedUsers) {
        const exists = await User.findOne({ where: { employeeId: u.id } });
        if (!exists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                employeeId: u.id,
                fullName: u.name,
                email: u.email,
                password: hashedPassword,
                role: u.role,
                phone: u.phone,
                department: u.role === 'IT Admin' ? 'IT' : 'Executive'
            });
            console.log(`👤 ${u.role} account created (${u.id} / admin123)`);
        }
    }
    } catch (err) {
        console.error('Database Sync Error:', err);
    }
})();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/employee-documents', require('./routes/employeeDocumentRoutes'));

// ── BI Analytics for Executive Dashboard ──
app.get('/api/stats', protect, async (req, res) => {
    try {
        const isExecutive = ['IT Admin', 'Chairman', 'CEO', 'HR', 'HR Manager'].includes(req.user.role);
        
        let totalEmployees = 0;
        let tasksDone = 0;
        let totalTasks = 0;
        let presentToday = 0;
        let attendancePct = 0;
        let productivity = 0;
        let totalTickets = 0;
        let completedTickets = 0;
        let raisedTickets = 0;
        let pendingTickets = 0;
        const meetingsToday = 0; // Not implemented yet
        
        let deptMap = {};
        let teamPerformance = [];
        let ticketsByPriority = { High: 0, Medium: 0, Low: 0 };
        let ticketsByStatus = { Working: 0, Completed: 0, Raised: 0 };

        if (isExecutive) {
            // Company-wide stats
            totalEmployees = await User.count();
            tasksDone = await Task.count({ where: { status: 'Completed' } });
            totalTasks = await Task.count();
            
            const today = new Date().toISOString().split('T')[0];
            presentToday = await Attendance.count({ where: { date: today } });
            attendancePct = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
            productivity = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

            totalTickets = await Ticket.count({ where: { isDeleted: false } });
            completedTickets = await Ticket.count({ where: { status: 'Completed', isDeleted: false } });
            raisedTickets = await Ticket.count({ where: { status: 'Raised', isDeleted: false } });
            pendingTickets = await Ticket.count({ where: { status: 'Working', isDeleted: false } });
            
            // Group tickets for charts
            const allTicks = await Ticket.findAll({ where: { isDeleted: false }, attributes: ['priority', 'status'] });
            allTicks.forEach(t => {
                if (ticketsByPriority[t.priority] !== undefined) ticketsByPriority[t.priority]++;
                if (ticketsByStatus[t.status] !== undefined) ticketsByStatus[t.status]++;
            });

            const users = await User.findAll({ attributes: ['employeeId', 'fullName', 'role', 'department'] });
            const allTasks = await Task.findAll();
            
            teamPerformance = users.map(u => {
                const d = u.department || 'Other';
                deptMap[d] = (deptMap[d] || 0) + 1;
                
                const userTasks = allTasks.filter(t => String(t.assignedTo) === String(u.employeeId));
                const totalU = userTasks.length;
                const doneU = userTasks.filter(t => t.status === 'Completed').length;
                
                let overdue = 0;
                const now = new Date();
                userTasks.forEach(t => {
                    if (t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now) overdue++;
                });

                return {
                    id: u.employeeId,
                    name: u.fullName,
                    role: u.role,
                    department: u.department,
                    totalTasks: totalU,
                    completedTasks: doneU,
                    overdue: overdue,
                    completionRate: totalU > 0 ? Math.round((doneU/totalU)*100) : 0
                };
            });
        } else {
            // Employee specific stats
            totalEmployees = 1; // self
            tasksDone = await Task.count({ where: { assignedTo: req.user.employeeId, status: 'Completed' } });
            totalTasks = await Task.count({ where: { assignedTo: req.user.employeeId } });
            
            const today = new Date().toISOString().split('T')[0];
            const myAtt = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
            presentToday = myAtt ? 1 : 0;
            attendancePct = presentToday * 100;
            productivity = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

            const myTicketWhere = { 
                isDeleted: false,
                [Op.or]: [
                    { creatorId: req.user.id },
                    { currentAssigneeId: req.user.id },
                    { '$TicketShares.userId$': req.user.id }
                ]
            };
            
            const myTickets = await Ticket.findAll({ 
                where: myTicketWhere,
                include: [{ model: TicketShare, required: false }]
            });
            
            totalTickets = myTickets.length;
            myTickets.forEach(t => {
                if (t.status === 'Completed') completedTickets++;
                else if (t.status === 'Raised') raisedTickets++;
                else if (t.status === 'Working') pendingTickets++;

                if (ticketsByPriority[t.priority] !== undefined) ticketsByPriority[t.priority]++;
                if (ticketsByStatus[t.status] !== undefined) ticketsByStatus[t.status]++;
            });
        }

        res.json({
            summary: {
                totalEmployees,
                presentToday,
                totalTasks,
                tasksDone,
                attendancePct,
                productivity,
                totalTickets,
                completedTickets,
                raisedTickets,
                pendingTickets,
                meetingsToday,
                ticketsByPriority,
                ticketsByStatus
            },
            departments: Object.entries(deptMap).map(([name, value]) => ({ name, value })),
            teamPerformance: teamPerformance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Stats retrieval failed' });
    }
});


// Socket.io for Real-time Chat


app.get('/api/backup/tickets', protect, async (req, res) => {
    // Only Executives
    if (!['IT Admin', 'Chairman', 'CEO'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized to download backups' });
    }
    
    try {
        const tickets = await Ticket.findAll({
            include: [
                { model: TicketHistory },
                { model: TicketComment },
                { model: TicketAttachment },
                { model: TicketShare }
            ]
        });
        
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        const filename = `TICKET_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(backupDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(tickets, null, 2));
        
        res.download(filepath, filename);
    } catch (err) {
        console.error('Backup Error:', err);
        res.status(500).json({ error: 'Backup failed', details: err.message });
    }
});

const onlineUsers = new Map();
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.userId = String(userId);
        socket.join(socket.userId); // Join a room for this ID
        onlineUsers.set(socket.userId, socket.id);
        console.log(`User ${userId} joined room ${socket.userId}`);
        // Broadcast that user is online
        io.emit('user_status', { userId: socket.userId, status: 'online' });
    });

    socket.on('send_message', async (data) => {
        try {
            const msg = await Message.create({
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                fileName: data.fileName
            });

            const msgData = msg.get({ plain: true });
            
            const isGroup = String(data.receiverId).includes('group') || String(data.receiverId).length > 20;
            if (isGroup) {
                io.emit('receive_message', msgData);
            } else {
                const receiverSocket = onlineUsers.get(String(data.receiverId));
                if (receiverSocket) io.to(receiverSocket).emit('receive_message', msgData);
                socket.emit('receive_message', msgData);
            }
        } catch (err) {
            console.error('Chat error:', err);
        }
    });

    socket.on('typing', (data) => {
        const receiverSocket = onlineUsers.get(String(data.receiverId));
        if (receiverSocket) {
            io.to(receiverSocket).emit('user_typing', { senderId: data.senderId, isGroup: data.isGroup });
        }
    });

    socket.on('stop_typing', (data) => {
        const receiverSocket = onlineUsers.get(String(data.receiverId));
        if (receiverSocket) {
            io.to(receiverSocket).emit('user_stop_typing', { senderId: data.senderId });
        }
    });

    socket.on('mark_read', async (data) => {
        try {
            await Message.update({ isRead: true }, {
                where: { senderId: data.otherId, receiverId: data.userId, isRead: false }
            });
            const otherSocket = onlineUsers.get(String(data.otherId));
            if (otherSocket) io.to(otherSocket).emit('messages_read', { userId: data.userId });
        } catch (err) { console.error(err); }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit('user_status', { userId: socket.userId, status: 'offline', lastSeen: new Date() });
        }
    });

    // --- WebRTC Meeting Signaling ---
    socket.on('join_meeting', (roomId) => {
        socket.join(roomId);
        // Tell others in the room that a new user joined
        socket.to(roomId).emit('user_joined_meeting', { userId: socket.userId });
    });

    socket.on('meeting_offer', (data) => {
        socket.to(data.roomId).emit('meeting_offer', {
            sdp: data.sdp,
            senderId: socket.userId
        });
    });

    socket.on('meeting_answer', (data) => {
        socket.to(data.roomId).emit('meeting_answer', {
            sdp: data.sdp,
            senderId: socket.userId
        });
    });

    socket.on('meeting_ice_candidate', (data) => {
        socket.to(data.roomId).emit('meeting_ice_candidate', {
            candidate: data.candidate,
            senderId: socket.userId
        });
    });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 EXO ERP Server running on port ${PORT}`));
