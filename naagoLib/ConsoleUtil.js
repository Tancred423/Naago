const moment = require('moment')

module.exports = class ConsoleUtil {
  static logError(message, error) {
    const date = moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
    console.error(`${date} [ERROR] ${message}`, error)
  }
}
