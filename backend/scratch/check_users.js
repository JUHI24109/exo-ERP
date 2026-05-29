const User = require('../models/User');
const sequelize = require('../config/db');

(async () => {
    try {
        const count = await User.count();
        console.log(`TOTAL USERS IN DB: ${count}`);
        const users = await User.findAll({ attributes: ['employeeId', 'fullName', 'role'] });
        console.log('USERS:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
