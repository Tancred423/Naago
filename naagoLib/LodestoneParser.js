const moment = require('moment')
const TurndownService = require('turndown')
const { decode } = require('html-entities')
const NaagoUtil = require('./NaagoUtil')

module.exports = class LodestoneParser {
  static decodeHtmlChars(text) {
    return decode(text)
  }

  static convertTimestampToMs(timestamp) {
    return isNaN(timestamp) ? timestamp : timestamp * 1000
  }

  static convertHtmlToMarkdown(html) {
    if (!html) return html

    const turndownService = new TurndownService()
    let markdown = turndownService.turndown(html)
    markdown = markdown
      .replaceAll('\\', '')
      .replaceAll('](/lodestone', '](https://eu.finalfantasyxiv.com/lodestone')

    return markdown
  }

  static convertTitles(markdown) {
    if (!markdown) return markdown

    const paragraphs = markdown.split('\n')

    paragraphs.forEach((item, index, arr) => {
      item = item.trim()

      if (item.startsWith('#'))
        arr[index] = '**__' + item.replaceAll('#', '').trim() + '__**'
      else if (item.startsWith('[') && item.endsWith(']'))
        arr[index] =
          '**__' + item.replaceAll('[', '').replaceAll(']', '').trim() + '__**'
    })

    return paragraphs.join('\n')
  }

  static convertTag(category, tag) {
    return tag
      ? NaagoUtil.capitalizeFirstLetter(category) +
          ': ' +
          tag.replaceAll('[', '').replaceAll(']', '')
      : NaagoUtil.capitalizeFirstLetter(category)
  }

  static convertImageLinks(markdown) {
    if (!markdown) return markdown

    const imageLinks = []
    const paragraphs = markdown.split('\n')
    let imageCounter = 0

    if (paragraphs[0].startsWith('[![](') || paragraphs[0].startsWith('![]('))
      paragraphs.shift()

    paragraphs.forEach((item, index, arr) => {
      item = item.trim()

      if (item.startsWith('[![](') || item.startsWith('![](')) {
        const imageLink = item.split('](')[1]?.slice(0, -1)
        if (imageLink && new RegExp('.jpg|.png').test(imageLink)) {
          imageLinks.push(imageLink)
          imageCounter += 1
        }
      } else if (
        (!item.startsWith('[![](') || item.startsWith('![](')) &&
        item !== '' &&
        imageCounter > 0
      ) {
        arr[index - 1] = `\n\n*${imageCounter} image${
          imageCounter === 1 ? '' : 's'
        }*\n`
        imageCounter = 0
      }
    })

    markdown = paragraphs.join('\n')
    if (imageLinks.length === 1) markdown = markdown.replaceAll('*1 image*', '')
    markdown = markdown.replaceAll(/\[\!\[\].*\?.*\)/g, '')
    markdown = markdown.replaceAll(/\!\[\].*\?.*\)/g, '')
    markdown = markdown.replaceAll(/\n{3,}/g, '\n\n')

    return {
      description: markdown,
      links: imageLinks
    }
  }

  static convertDates(category, markdown) {
    switch (category) {
      case 'topics':
        return this.convertDatesTopics(markdown)
      case 'notices':
        return this.convertDatesNotices(markdown)
      case 'maints':
        return this.convertDatesMaints(markdown)
      case 'updates':
        return this.convertDatesUpdatesStatus(markdown)
      case 'status':
        return this.convertDatesUpdatesStatus(markdown)
      default:
        return markdown
    }
  }

  static convertDatesTopics(markdown) {
    const paragraphs = markdown.split('\n')
    let inBlock = false

    paragraphs.forEach((item, index, arr) => {
      item = this.cleanItem(item)

      if (inBlock && item.endsWith('GMT')) {
        let fromDate
        let toDate
        const isToDate = item.includes(' to ')

        if (isToDate) {
          const fromTo = item.split(' to ')
          const from = fromTo[0].replaceAll('GMT', '').trim()
          let to = fromTo[1].replaceAll('GMT', '').trim()

          fromDate = moment.utc(from, 'dddd D MMMM H:mm')

          const year = this.isNextYear(from.split(' ')[2], to.split(' ')[2])
            ? (parseInt(fromDate.format('YYYY')) + 1).toString()
            : fromDate.format('YYYY')

          to = year + ' ' + to

          toDate = moment.utc(to, 'YYYY dddd D MMMM H:mm')
        } else {
          fromDate = moment.utc(item, 'dddd D MMMM H:mm')
        }

        if (fromDate.isValid())
          arr[index] = this.getFormattedDate(fromDate, toDate)

        inBlock = false
      } else if (item.startsWith('__')) {
        inBlock = true
      }
    })

    return paragraphs.join('\n')
  }

  static convertDatesNotices(markdown) {
    const paragraphs = markdown.split('\n')

    paragraphs.forEach((item, index, arr) => {
      item = this.cleanItem(item)

      if (item.startsWith('Time Period:')) {
        item = item.replaceAll('Time Period:', '').trim()

        let fromDate
        let toDate
        const isToDate = item.includes(' to ')

        if (isToDate) {
          const fromTo = item.split(' to ')
          const from = fromTo[0].trim()
          const to = fromTo[1].trim()

          fromDate = moment.utc(from, 'MMM D YYYY')
          toDate = moment.utc(to, 'MMM D YYYY')
        } else {
          fromDate = moment.utc(item, 'MMM D YYYY')
        }

        if (fromDate.isValid())
          arr[index] =
            'Time Period:\n' + this.getFormattedDate(fromDate, toDate, false)
      }
    })

    return paragraphs.join('\n')
  }

  static convertDatesMaints(markdown) {
    const paragraphs = markdown.split('\n')

    let fromDate
    let toDate

    paragraphs.forEach((item, index, arr) => {
      item = this.cleanItem(item)

      if (item.endsWith('GMT')) {
        fromDate = undefined
        toDate = undefined
        const isToDate = item.includes(' to ')

        if (isToDate) {
          const fromTo = item.split(' ')
          const from = NaagoUtil.removeIndicesFromArray([...fromTo], 4, 5, 6)
          const to = NaagoUtil.removeIndicesFromArray([...fromTo], 3, 4, 6)

          fromDate = moment.utc(from, 'MMM D YYYY H:mm')
          toDate = moment.utc(to, 'MMM D YYYY H:mm')
        } else {
          fromDate = moment.utc(item.replaceAll('GMT', ''), 'MMM D YYYY H:mm')
        }

        if (fromDate.isValid())
          arr[index] = this.getFormattedDate(fromDate, toDate)
        else {
          fromDate = undefined
          toDate = undefined
        }
      }
    })

    return {
      details: paragraphs.join('\n'),
      from: fromDate,
      to: toDate
    }
  }

  static convertDatesUpdatesStatus(markdown) {
    const paragraphs = markdown.split('\n')

    paragraphs.forEach((item, index, arr) => {
      item = this.cleanItem(item)

      if (item.endsWith('GMT')) {
        let fromDate
        let toDate
        const isToDate = item.includes(' to ')

        if (isToDate) {
          const fromTo = item.split(' ')
          const from = NaagoUtil.removeIndicesFromArray([...fromTo], 4, 5, 6)
          const to = NaagoUtil.removeIndicesFromArray([...fromTo], 3, 4, 6)

          fromDate = moment.utc(from, 'MMM D YYYY H:mm')
          toDate = moment.utc(to, 'MMM D YYYY H:mm')
        } else {
          fromDate = moment.utc(item.replaceAll('GMT', ''), 'MMM D YYYY H:mm')
        }

        if (fromDate.isValid())
          arr[index] = this.getFormattedDate(fromDate, toDate)
      }
    })

    return paragraphs.join('\n')
  }

  static cleanItem(item) {
    return item
      .replaceAll('From', '')
      .replaceAll('from', '')
      .replaceAll('around', '')
      .replaceAll('.', '')
      .replaceAll(',', '')
      .replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll('!', '')
      .replaceAll('*', '')
      .replaceAll('\n', '')
      .replaceAll(/\s+/g, ' ')
      .trim()
  }

  static isNextYear(month1, month2) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'October',
      'November',
      'December'
    ]
    return months.indexOf(month2) < months.indexOf(month1)
  }

  static getFormattedDate(from, to, withHours = true) {
    if (withHours) {
      // Europe
      let formatted = `🇪🇺 ${from
        .tz('Europe/Berlin')
        .format('MMM. DD **HH:mm z**')}`

      if (to)
        formatted += ` - ${to
          .tz('Europe/Berlin')
          .format('MMM. DD **HH:mm z**')}`

      // GMT/UTC
      formatted += `\n🇬🇧 ${from
        .tz('Europe/London')
        .format('MMM. DD **HH:mm z**')}`

      if (to)
        formatted += ` - ${to
          .tz('Europe/London')
          .format('MMM. DD **HH:mm z**')}`

      // Japan
      formatted += `\n🇯🇵 ${from.tz('Asia/Tokyo').format('MMM. DD **HH:mm z**')}`

      if (to)
        formatted += ` - ${to.tz('Asia/Tokyo').format('MMM. DD **HH:mm z**')}`

      // US West
      formatted += `\n🇺🇸 ${from
        .tz('America/Los_Angeles')
        .format('MMM. DD **HH:mm z**')}`

      if (to)
        formatted += ` - ${to
          .tz('America/Los_Angeles')
          .format('MMM. DD **HH:mm z**')}`

      // US East
      formatted += `\n🇺🇸 ${from
        .tz('America/New_York')
        .format('MMM. DD **HH:mm z**')}`

      if (to)
        formatted += ` - ${to
          .tz('America/New_York')
          .format('MMM. DD **HH:mm z**')}`

      return formatted
    } else {
      // Europe
      let formatted = `🇪🇺 ${from.tz('Europe/Berlin').format('**MMM. DD**')}`

      if (to) formatted += ` - ${to.tz('Europe/Berlin').format('**MMM. DD**')}`

      // GMT/UTC
      formatted += `\n🇬🇧 ${from.tz('Europe/London').format('**MMM. DD**')}`

      if (to) formatted += ` - ${to.tz('Europe/London').format('**MMM. DD**')}`

      // Japan
      formatted += `\n🇯🇵 ${from.tz('Asia/Tokyo').format('**MMM. DD**')}`

      if (to) formatted += ` - ${to.tz('Asia/Tokyo').format('**MMM. DD**')}`

      // US West
      formatted += `\n🇺🇸 ${from
        .tz('America/Los_Angeles')
        .format('**MMM. DD**')}`

      if (to)
        formatted += ` - ${to.tz('America/Los_Angeles').format('**MMM. DD**')}`

      // US East
      formatted += `\n🇺🇸 ${from.tz('America/New_York').format('**MMM. DD**')}`

      if (to)
        formatted += ` - ${to.tz('America/New_York').format('**MMM. DD**')}`

      return formatted
    }
  }
}
