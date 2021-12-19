const { from } = require('form-data')
const moment = require('moment')

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

  static prettifyPermissionArray(array) {
    const pretty = []
    array.forEach((element) => {
      const split = element.split('_')
      pretty.push(
        `${this.capitalizeFirstLetter(split[0])} ${this.capitalizeFirstLetter(
          split[1]
        )}`
      )
    })

    return pretty.join(', ')
  }

  static getWebsiteName(hostname) {
    if (hostname === 'github.com') return 'GitHub'
    else if (hostname === 'instagram.com') return 'Instagram'
    else if (hostname === 'reddit.com') return 'Reddit'
    else if (hostname === 'spotify.com') return 'Spotify'
    else if (hostname === 'steamcommunity.com') return 'Steam'
    else if (hostname === 'tiktok.com') return 'TikTok'
    else if (hostname === 'twitch.tv') return 'Twitch'
    else if (hostname === 'twitter.com') return 'Twitter'
    else return 'YouTube'
  }

  static cutString(string, length) {
    if (string.length > length) string.substring(0, length - 3) + '...'
    else return string
  }

  static removeDuplicated(array) {
    return [...new Set(array)]
  }

  static removeIndicesFromArray(array, ...indices) {
    for (const [i, index] of indices.entries()) array.splice(index - i, 1)
    return array
  }

  static enrichDates(text) {
    if (!text) return null

    // Parse dates
    const textSplit = text.replaceAll('\n', ' \n ').split(' ')

    const blocks = []
    let stringBuilder = ''
    let inBlock = false

    for (const word of textSplit) {
      if (inBlock && word.startsWith('[')) {
        blocks.push(
          stringBuilder
            .replaceAll('* Completion time is subject to change.', '')
            .replaceAll('\n', '')
            .trim()
        )
        stringBuilder = ''
        inBlock = false
        continue
      }

      if (word === 'Time]') {
        inBlock = true
        continue
      }

      if (inBlock) stringBuilder += ` ${word}`
    }

    if (inBlock) {
      blocks.push(
        stringBuilder
          .replaceAll('* Completion time is subject to change.', '')
          .replaceAll('\n', '')
          .trim()
      )
      stringBuilder = ''
      inBlock = false
    }

    const datesToEnrich = this.removeDuplicated(blocks)

    // Enrich dates
    const dateReplacements = new Map()
    let mFrom
    let mTo

    for (const date of datesToEnrich) {
      let fromString = this.removeIndicesFromArray(date.split(' '), 4, 5)
        .join(' ')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll(',', '')
      fromString = this.replaceMonthWithNumber(fromString)
      let toString = this.removeIndicesFromArray(date.split(' '), 3, 4)
        .join(' ')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll(',', '')
      toString = this.replaceMonthWithNumber(toString)

      mFrom = moment.utc(fromString, 'MM D YYYY h:mm')
      mTo = moment.utc(toString, 'MM D YYYY h:mm')

      let formatted = `🇩🇪 ${mFrom
        .tz('Europe/Berlin')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('Europe/Berlin')
        .format('MMM. DD **HH:mm z**')}`
      formatted += `\n🇪🇸 ${mFrom
        .tz('Europe/Madrid')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('Europe/Madrid')
        .format('MMM. DD **HH:mm z**')}`
      formatted += `\n🇫🇷 ${mFrom
        .tz('Europe/Paris')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('Europe/Paris')
        .format('MMM. DD **HH:mm z**')}`
      formatted += `\n🇬🇧 ${mFrom
        .tz('Europe/London')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('Europe/London')
        .format('MMM. DD **HH:mm z**')}`
      formatted += `\n🇯🇵 ${mFrom
        .tz('Asia/Tokyo')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('Asia/Tokyo')
        .format('MMM. DD **HH:mm z**')}`
      formatted += `\n🇺🇸 ${mFrom
        .tz('America/Los_Angeles')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('America/Los_Angeles')
        .format('MMM. DD **HH:mm z**')}`
      formatted += `\n🇺🇸 ${mFrom
        .tz('America/New_York')
        .format('MMM. DD **HH:mm z**')} - ${mTo
        .tz('America/New_York')
        .format('MMM. DD **HH:mm z**')}`

      dateReplacements.set(date, formatted)
    }

    dateReplacements.forEach((value, key) => {
      text = text.replaceAll(key, value)
    })

    return {
      text: text,
      mFrom: mFrom,
      mTo: mTo
    }
  }

  static replaceMonthWithNumber(dateString) {
    return dateString
      .replaceAll('Jan.', '01')
      .replaceAll('Feb.', '02')
      .replaceAll('Mar.', '03')
      .replaceAll('Apr.', '04')
      .replaceAll('May.', '05')
      .replaceAll('Jun.', '06')
      .replaceAll('Jul.', '07')
      .replaceAll('Aug.', '08')
      .replaceAll('Sep.', '09')
      .replaceAll('Oct.', '10')
      .replaceAll('Nov.', '11')
      .replaceAll('Dec.', '12')
      .replaceAll('Jan', '01')
      .replaceAll('Feb', '02')
      .replaceAll('Mar', '03')
      .replaceAll('Apr', '04')
      .replaceAll('May', '05')
      .replaceAll('Jun', '06')
      .replaceAll('Jul', '07')
      .replaceAll('Aug', '08')
      .replaceAll('Sep', '09')
      .replaceAll('Oct', '10')
      .replaceAll('Nov', '11')
      .replaceAll('Dec', '12')
  }
}
