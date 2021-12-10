module.exports = class NaagoUtil {
  static convertMsToDigitalClock(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const daysms = ms % (24 * 60 * 60 * 1000)
    const hours = Math.floor(daysms / (60 * 60 * 1000))
    const hoursms = ms % (60 * 60 * 1000)
    const minutes = Math.floor(hoursms / (60 * 1000))
    const minutesms = ms % (60 * 1000)
    const sec = Math.floor(minutesms / 1000)

    return (
      (days === 0 ? '' : `${days} d `) +
      (hours === 0 ? '' : `${hours} h `) +
      (minutes === 0 ? '' : `${minutes} m `) +
      `${sec} s`
    )
  }

  static addLeadingZeros(num, length) {
    const numString = num.toString()
    if (numString.length >= length) return numString
    else return '0'.repeat(length - numString.length) + numString
  }

  static getApostropheS(name) {
    return name.endsWith('s') ? "'" : "'s"
  }

  static capitalizeFirstLetter(string) {
    return (
      string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase()
    )
  }
}
