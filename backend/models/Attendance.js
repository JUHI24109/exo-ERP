const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  loginTime: { type: DataTypes.DATE },
  logoutTime: { type: DataTypes.DATE },
  hoursWorked: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { 
    type: DataTypes.ENUM('Present', 'Half Day', 'Absent', 'Leave', 'Holiday'), 
    defaultValue: 'Present' 
  }
});

Attendance.belongsTo(User, { as: 'Employee', foreignKey: 'userId' });

module.exports = Attendance;
