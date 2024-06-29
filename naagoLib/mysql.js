const { dbHost, dbUser, dbPass, dbDatabase, dbPort } = require('../config.json')
const mysql = require('mysql2')

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPass,
  database: dbDatabase,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: 'utf8mb4',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const promisePool = pool.promise()

console.log('Connected: MySQL')

module.exports = promisePool
