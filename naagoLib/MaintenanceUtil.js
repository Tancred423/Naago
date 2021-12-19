const axios = require('axios')
const DbUtil = require('./DbUtil')
const moment = require('moment')
const { MessageEmbed } = require('discord.js')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const { maintenanceIconLink } = require('../config.json')
const GlobalUtil = require('./GlobalUtil')

module.exports = class MaintenanceUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8080/lodestone/maintenance')
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

    const last10 = await this.getLast10()
    const newMaintenances = []

    for (const maint of last10) {
      if (await DbUtil.getMaintenanceByTitle(maint.title)) break
      newMaintenances.push(maint)
    }

    for (const newMaint of newMaintenances.reverse()) {
      if (newMaint.details) {
        let detailsFormatted =
          newMaint.details?.text
            .replaceAll('<br>', '')
            .replaceAll('&amp;', '&') ?? null
        detailsFormatted = NaagoUtil.cutString(detailsFormatted, 4096)
        const enrich = NaagoUtil.enrichDates(detailsFormatted)
        newMaint.details = enrich.text
        newMaint.mFrom = enrich.mFrom
        newMaint.mTo = enrich.mTo
        newMaint.date = newMaint.date * 1000
      }

      DbUtil.addMaintenance(newMaint)
      await MaintenanceUtil.sendMaint(newMaint)
    }
  }

  static async sendMaint(maint) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const mInfo = await DbUtil.getMaintenanceInfo()
    if (!mInfo || mInfo?.length < 1) return

    for (const info of mInfo) {
      const guild = await client.guilds.fetch(info.guild_id)
      if (!guild) continue
      const channel = await guild.channels.fetch(info.channel_id)
      if (!channel) continue

      const botColor = await DiscordUtil.getBotColorByClientGuild(client, guild)
      const embed = DiscordUtil.getMaintenanceEmbed(maint, botColor)

      await channel.send({ embeds: [embed] })
    }
  }
}
