const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')
const Parser = require('./LodestoneParser')

module.exports = class StatusUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/status')
      return res?.data?.Status ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm')}] Checking for status`)

    const latestStatuses = await this.getLast10()
    const newStatuses = []

    for (const status of latestStatuses) {
      if (!status) continue

      status.title = status.title ? status.title : status.title_full
      status.title = Parser.decodeHtmlChars(status.title)
      status.date = Parser.convertTimestampToMs(status.date)

      // Only process new ones
      if (await DbUtil.getStatusByTitle(status.title, status.date)) continue

      // Details
      status.details = status.details?.text
      status.details = Parser.decodeHtmlChars(status.details)
      status.details = Parser.convertHtmlToMarkdown(status.details)
      status.details = Parser.convertTitles(status.details)
      status.details = Parser.convertDates('status', status.details)
      status.details = NaagoUtil.cutString(status.details, 2500)

      // Tag
      status.tag = Parser.convertTag('status', status.tag)

      newStatuses.push(status)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New statuses: ${
        newStatuses.length
      }`
    )

    for (const newStatus of newStatuses.reverse()) {
      DbUtil.addStatus(newStatus)
      await StatusUtil.sendStatus(newStatus)
    }
  }

  static async sendStatus(status) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('status')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getStatusEmbed(status)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[STATUS] Sending status to ${setup.guild_id} was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
