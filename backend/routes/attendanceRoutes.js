const express = require('express');
const { Op } = require('sequelize');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    res.json(record);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/checkin', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    if (existing) {
      return res.status(400).json({ error: 'Already clocked in for today' });
    }
    const record = await Attendance.create({ userId: req.user.id, date: today, loginTime: new Date(), status: 'Present' });
    res.json(record);
  } catch (err) { 
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Failed to clock in' }); 
  }
});

router.post('/checkout', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    if (record) {
      const logout = new Date();
      record.logoutTime = logout;
      
      if (record.loginTime) {
        const msDiff = logout - new Date(record.loginTime);
        const hours = msDiff / (1000 * 60 * 60);
        record.hoursWorked = hours;
        
        // 9 hours threshold
        if (hours >= 9) {
          record.status = 'Present'; // Green
        } else {
          record.status = 'Half Day'; // Or could be Red depending on HR rules
        }
      }

      await record.save();
      res.json(record);
    } else res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get my own attendance records
router.get('/mine', protect, async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
      limit: 60
    });
    res.json(records);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// HR/Admin day-wise attendance view
router.get('/admin/day', protect, async (req, res) => {
  try {
    if (!['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await Attendance.findAll({
      where: { date },
      include: [{ model: User, as: 'Employee', attributes: ['id', 'fullName', 'employeeId', 'role'] }],
      order: [['loginTime', 'ASC']]
    });

    res.json({ date, total: records.length, records });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
});

// HR/Admin monthly attendance with filters
router.get('/admin/monthly', protect, async (req, res) => {
  try {
    if (!['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { month, employeeId } = req.query; // month format YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query is required in YYYY-MM format' });
    }

    const start = `${month}-01`;
    const endDate = new Date(`${month}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);

    const where = {
      date: { [Op.gte]: start, [Op.lt]: end }
    };

    if (employeeId) where.userId = employeeId;

    const records = await Attendance.findAll({
      where,
      include: [{ model: User, as: 'Employee', attributes: ['id', 'fullName', 'employeeId', 'role'] }],
      order: [['date', 'ASC']]
    });

    const grouped = {};
    for (const r of records) {
      const key = `${r.userId}`;
      if (!grouped[key]) {
        grouped[key] = {
          userId: r.userId,
          employeeId: r.Employee?.employeeId || '',
          fullName: r.Employee?.fullName || 'Unknown',
          role: r.Employee?.role || '',
          totalDays: 0,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          leaveDays: 0,
          totalHoursWorked: 0
        };
      }
      grouped[key].totalDays += 1;
      if (r.status === 'Present') grouped[key].presentDays += 1;
      if (r.status === 'Half Day') grouped[key].halfDays += 1;
      if (r.status === 'Absent') grouped[key].absentDays += 1;
      if (r.status === 'Leave') grouped[key].leaveDays += 1;
      grouped[key].totalHoursWorked += Number(r.hoursWorked || 0);
    }

    res.json({
      month,
      summary: Object.values(grouped),
      records
    });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
});

// HR/Admin date range attendance with filters
router.get('/admin/range', protect, async (req, res) => {
  try {
    if (!['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { from, to, employeeId } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to queries are required (YYYY-MM-DD)' });
    }

    const start = new Date(from);
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1); // include the 'to' date
    const end = endDate.toISOString().slice(0, 10);

    const where = {
      date: { [Op.gte]: from, [Op.lt]: end }
    };

    if (employeeId) where.userId = employeeId;

    const records = await Attendance.findAll({
      where,
      include: [{ model: User, as: 'Employee', attributes: ['id', 'fullName', 'employeeId', 'role'] }],
      order: [['date', 'ASC']]
    });

    const grouped = {};
    for (const r of records) {
      const key = `${r.userId}`;
      if (!grouped[key]) {
        grouped[key] = {
          userId: r.userId,
          employeeId: r.Employee?.employeeId || '',
          fullName: r.Employee?.fullName || 'Unknown',
          role: r.Employee?.role || '',
          totalDays: 0,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          leaveDays: 0,
          totalHoursWorked: 0,
          records: []
        };
      }
      grouped[key].totalDays += 1;
      if (r.status === 'Present') grouped[key].presentDays += 1;
      if (r.status === 'Half Day') grouped[key].halfDays += 1;
      if (r.status === 'Absent') grouped[key].absentDays += 1;
      if (r.status === 'Leave') grouped[key].leaveDays += 1;
      grouped[key].totalHoursWorked += Number(r.hoursWorked || 0);
      grouped[key].records.push(r);
    }

    res.json({
      from,
      to,
      summary: Object.values(grouped)
    });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
});

module.exports = router;
