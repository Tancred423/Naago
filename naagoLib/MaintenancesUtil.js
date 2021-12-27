const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const GlobalUtil = require('./GlobalUtil')
const Parser = require('./LodestoneParser')

module.exports = class MaintenancesUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/maintenance')
      return res?.data?.Maintenances ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] Checking for maintenances`
    )

    const latestMaintenances = await this.getLast10()
    const newMaintenances = []

    for (const maint of latestMaintenances) {
      if (!maint) continue

      maint.title = Parser.decodeHtmlChars(maint.title)
      maint.date = Parser.convertTimestampToMs(maint.date)

      // Only process new ones
      if (await DbUtil.getMaintenanceByTitle(maint.title, maint.date)) continue

      // Details
      maint.details = maint.details?.text
      maint.details = Parser.decodeHtmlChars(maint.details)
      maint.details = Parser.convertHtmlToMarkdown(maint.details)
      maint.details = Parser.convertTitles(maint.details)
      const enrich = Parser.convertDates('maints', maint.details)
      maint.details = enrich.details
      maint.from = enrich.from
      maint.to = enrich.to
      maint.details = NaagoUtil.cutString(maint.details, 2500)

      // Tag
      maint.tag = maint.tag === '[Maintenance]' ? undefined : maint.tag
      maint.tag = Parser.convertTag('maintenance', maint.tag)

      newMaintenances.push(maint)
    }

    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] New maintenances: ${
        newMaintenances.length
      }`
    )

    for (const newMaint of newMaintenances.reverse()) {
      DbUtil.addMaintenance(newMaint)
      await MaintenancesUtil.sendMaint(newMaint)
    }
  }

  static async sendMaint(maint) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('maintenances')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)
        if (!guild) continue
        const channel = await guild.channels.fetch(setup.channel_id)
        if (!channel) continue

        const embed = DiscordUtil.getMaintenanceEmbed(maint)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[MAINTENANCES] Sending maintenance to ${setup.guild_id} was NOT successful: ${err.message}`
        )
        continue
      }
    }
  }
}
