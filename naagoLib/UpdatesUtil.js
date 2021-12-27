const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')
const Parser = require('./LodestoneParser')

module.exports = class UpdatesUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/updates')
      return res?.data?.Updates ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm')}] Checking for updates`)

    const latestUpdates = await this.getLast10()
    const newUpdates = []

    for (const update of latestUpdates) {
      if (!update) continue

      update.title = Parser.decodeHtmlChars(update.title)
      update.date = Parser.convertTimestampToMs(update.date)

      // Only process new ones
      if (await DbUtil.getUpdateByTitle(update.title, update.date)) continue

      // Details
      update.details = update.details?.text
      update.details = Parser.decodeHtmlChars(update.details)
      update.details = Parser.convertHtmlToMarkdown(update.details)
      update.details = Parser.convertTitles(update.details)
      update.details = Parser.convertDates('updates', update.details)
      update.details = NaagoUtil.cutString(update.details, 2500)
      newUpdates.push(update)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New updates: ${
        newUpdates.length
      }`
    )

    for (const newUpdate of newUpdates.reverse()) {
      DbUtil.addUpdate(newUpdate)
      await UpdatesUtil.sendUpdate(newUpdate)
    }
  }

  static async sendUpdate(update) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('updates')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getUpdatesEmbed(update)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[UPDATES] Sending update to ${setup.guild_id} was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
