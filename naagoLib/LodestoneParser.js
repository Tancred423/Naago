const moment = require('moment')
const TurndownService = require('turndown')
const { decode } = require('html-entities')
const NaagoUtil = require('./NaagoUtil')
const { time } = require('@discordjs/builders')

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
    markdown = markdown
      .replaceAll(/\[!\[\].*\?.*\)/g, '')
      .replaceAll(/!\[\].*\?.*\)/g, '')
      .replaceAll(/\n{3,}/g, '\n\n')

    return {
      description: markdown,
      links: imageLinks,
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

      if (inBlock && (item.endsWith('AEDT') || item.endsWith('AEST'))) {
        item = item.split('/')[0].trim()
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

          if (fromDate.isAfter(toDate)) toDate = toDate.add(1, 'days')
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

    return paragraphs.join('\n').replaceAll(/__\*\*\n+/g, '__**\n')
  }

  static convertDatesNotices(markdown) {
    const paragraphs = markdown.split('\n')

    const regexTimeframes =
      /.*Sometime on (?<date>.*) between (?<time1>.*) and (?<time2>.*) \(.*\) \/ \d+:\d+ and \d+:\d+ \(.*\) \/ \d+:\d+ and \d+:\d+ \(.*\)/

    paragraphs.forEach((item, index, arr) => {
      if (regexTimeframes.test(item)) {
        const groups = item.match(regexTimeframes).groups
        const start = moment.utc(
          groups.date + ' ' + groups.time1,
          'MMM. D, YYYY H:mm',
        )
        const end = moment.utc(
          groups.date + ' ' + groups.time2,
          'MMM. D, YYYY H:mm',
        )

        arr[index] =
          '・Sometime between ' +
          time(start.toDate()) +
          ' and ' +
          time(end.toDate())
      }
    })

    return paragraphs.join('\n')
  }

  static convertDatesMaints(markdown) {
    const paragraphs = markdown.split('\n')
    const newParagraphs = []

    let fromDate
    let toDate

    paragraphs.forEach((item) => {
      const cleanItem = this.cleanItem(item)
      let altered = false

      if (cleanItem.endsWith('GMT')) {
        fromDate = undefined
        toDate = undefined
        const isToDate = cleanItem.includes(' to ')

        if (isToDate) {
          const fromTo = cleanItem.split(' ')
          const from = NaagoUtil.removeIndicesFromArray([...fromTo], 4, 5, 6)
          const to = NaagoUtil.removeIndicesFromArray([...fromTo], 3, 4, 6)

          fromDate = moment.utc(from, 'MMM D YYYY H:mm')
          toDate = moment.utc(to, 'MMM D YYYY H:mm')

          if (fromDate.isAfter(toDate)) toDate = toDate.add(1, 'days')
        } else {
          fromDate = moment.utc(
            cleanItem.replaceAll('GMT', ''),
            'MMM D YYYY H:mm',
          )
        }

        if (fromDate.isValid()) {
          newParagraphs.push(this.getFormattedDate(fromDate, toDate))
          altered = true
        } else {
          fromDate = undefined
          toDate = undefined
        }
      } else if (
        cleanItem.endsWith('AEDT') ||
        cleanItem.endsWith('AEST') ||
        cleanItem.endsWith('BST')
      ) {
        // Do not append line. Skip original AEDT/AEST/BST line as we create our own.
        altered = true
      }

      if (!altered) newParagraphs.push(item)
    })

    return {
      details: newParagraphs.join('\n'),
      from: fromDate,
      to: toDate,
    }
  }

  static convertDatesUpdatesStatus(markdown) {
    const paragraphs = markdown.split('\n')
    const newParagraphs = []

    paragraphs.forEach((item) => {
      const cleanItem = this.cleanItem(item)
      let altered = false

      if (cleanItem.endsWith('GMT')) {
        let fromDate
        let toDate
        const isToDate = cleanItem.includes(' to ')

        if (isToDate) {
          const fromTo = cleanItem.split(' ')
          const from = NaagoUtil.removeIndicesFromArray([...fromTo], 4, 5, 6)
          const to = NaagoUtil.removeIndicesFromArray([...fromTo], 3, 4, 6)

          fromDate = moment.utc(from, 'MMM D YYYY H:mm')
          toDate = moment.utc(to, 'MMM D YYYY H:mm')

          if (fromDate.isAfter(toDate)) toDate = toDate.add(1, 'days')
        } else {
          fromDate = moment.utc(
            cleanItem.replaceAll('GMT', ''),
            'MMM D YYYY H:mm',
          )
        }

        if (fromDate.isValid()) {
          newParagraphs.push(this.getFormattedDate(fromDate, toDate))
          altered = true
        }
      } else if (
        cleanItem.endsWith('AEDT') ||
        cleanItem.endsWith('AEST') ||
        cleanItem.endsWith('BST')
      ) {
        // Do not append line. Skip original AEDT/AEST/BST line as we create our own.
        altered = true
      }

      if (!altered) newParagraphs.push(item)
    })

    return newParagraphs.join('\n')
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
      'December',
    ]
    return months.indexOf(month2) < months.indexOf(month1)
  }

  static getFormattedDate(from, to) {
    if (to)
      return (
        time(from.toDate()) +
        ' to ' +
        time(to.toDate()) +
        '\nStart: ' +
        time(from.toDate(), 'R') +
        '\nEnd: ' +
        time(to.toDate(), 'R')
      )
    else return time(from.toDate()) + ' (' + time(from.toDate(), 'R') + ')'

    // if (withHours) {
    //   // GMT/UTC
    //   let formatted = `🇬🇧 ${from
    //     .tz('Europe/London')
    //     .format('MMM. DD **HH:mm z**')}`

    //   if (to)
    //     formatted += ` - ${to
    //       .tz('Europe/London')
    //       .format('MMM. DD **HH:mm z**')}`

    //   // Europe
    //   formatted += `\n🇪🇺 ${from
    //     .tz('Europe/Berlin')
    //     .format('MMM. DD **HH:mm z**')}`

    //   if (to)
    //     formatted += ` - ${to
    //       .tz('Europe/Berlin')
    //       .format('MMM. DD **HH:mm z**')}`

    //   // Japan
    //   formatted += `\n---\n🇯🇵 ${from
    //     .tz('Asia/Tokyo')
    //     .format('MMM. DD **HH:mm z**')}`

    //   if (to)
    //     formatted += ` - ${to.tz('Asia/Tokyo').format('MMM. DD **HH:mm z**')}`

    //   // Oceania
    //   formatted += `\n🇦🇺 ${from
    //     .tz('Australia/Sydney')
    //     .format('MMM. DD **HH:mm z**')}`

    //   if (to)
    //     formatted += ` - ${to
    //       .tz('Australia/Sydney')
    //       .format('MMM. DD **HH:mm z**')}`

    //   // US West
    //   formatted += `\n---\n🇺🇸 ${from
    //     .tz('America/Los_Angeles')
    //     .format('MMM. DD **HH:mm z**')}`

    //   if (to)
    //     formatted += ` - ${to
    //       .tz('America/Los_Angeles')
    //       .format('MMM. DD **HH:mm z**')}`

    //   // US East
    //   formatted += `\n🇺🇸 ${from
    //     .tz('America/New_York')
    //     .format('MMM. DD **HH:mm z**')}`

    //   if (to)
    //     formatted += ` - ${to
    //       .tz('America/New_York')
    //       .format('MMM. DD **HH:mm z**')}`

    //   return formatted
    // } else {
    //   // Europe
    //   let formatted = `🇪🇺 ${from.tz('Europe/Berlin').format('**MMM. DD**')}`

    //   if (to) formatted += ` - ${to.tz('Europe/Berlin').format('**MMM. DD**')}`

    //   // GMT/UTC
    //   formatted += `\n🇬🇧 ${from.tz('Europe/London').format('**MMM. DD**')}`

    //   if (to) formatted += ` - ${to.tz('Europe/London').format('**MMM. DD**')}`

    //   // Japan
    //   formatted += `\n🇯🇵 ${from.tz('Asia/Tokyo').format('**MMM. DD**')}`

    //   if (to) formatted += ` - ${to.tz('Asia/Tokyo').format('**MMM. DD**')}`

    //   // Oceania
    //   formatted += `\n🇦🇺 ${from.tz('Australia/Sydney').format('**MMM. DD**')}`

    //   if (to)
    //     formatted += ` - ${to.tz('Australia/Sydney').format('**MMM. DD**')}`

    //   // US West
    //   formatted += `\n🇺🇸 ${from
    //     .tz('America/Los_Angeles')
    //     .format('**MMM. DD**')}`

    //   if (to)
    //     formatted += ` - ${to.tz('America/Los_Angeles').format('**MMM. DD**')}`

    //   // US East
    //   formatted += `\n🇺🇸 ${from.tz('America/New_York').format('**MMM. DD**')}`

    //   if (to)
    //     formatted += ` - ${to.tz('America/New_York').format('**MMM. DD**')}`

    //   return formatted
    // }
  }
}
