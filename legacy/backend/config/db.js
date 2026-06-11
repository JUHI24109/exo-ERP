const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sequelize;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://')) {
  console.log('🔗 Connecting to PostgreSQL database...');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      // If hosted remotely, uncomment the next block:
      // ssl: { require: true, rejectUnauthorized: false }
    }
  });
} else {
  console.log('🔗 Falling back to SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;


