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
    switch (hostname) {
      case 'github.com':
        return 'GitHub'
      case 'instagram.com':
        return 'Instagram'
      case 'reddit.com':
        return 'Reddit'
      case 'spotify.com':
        return 'Spotify'
      case 'steamcommunity.com':
        return 'Steam'
      case 'tiktok.com':
        return 'TikTok'
      case 'twitch.tv':
        return 'Twitch'
      case 'twitter.com':
        return 'Twitter'
      default:
        return 'YouTube'
    }
  }

  static cutString(string, length, link = null) {
    if (!string) return string
    else if (string.length > length)
      return (
        string.substring(0, length - 3) +
        (link ? `\n\n*[Continue reading...](${link})*` : '...')
      )
    else return string
  }

  static removeDuplicated(array) {
    return [...new Set(array)]
  }

  static removeIndicesFromArray(array, ...indices) {
    for (const [i, index] of indices.entries()) array.splice(index - i, 1)
    return array
  }

  static removeItemFromArray(arr, value) {
    const index = arr.indexOf(value)
    if (index > -1) {
      arr.splice(index, 1)
    }
    return arr
  }
}
