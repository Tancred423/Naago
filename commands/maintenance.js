const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const { maintenanceIconLink } = require('../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Current FFXIV maintenance if any.'),
  async execute(interaction) {
    const maints = await DbUtil.getCurrentMaintenances()

    if (maints) {
      const botColor = await DiscordUtil.getBotColorByInteraction(interaction)
      const embedsCollection = []
      const tmpEmbeds = []

      for (const maint of maints) {
        if (tmpEmbeds.length >= 10) {
          embedsCollection.push(tmpEmbeds)
          tmpEmbeds = []
        }

        tmpEmbeds.push(DiscordUtil.getMaintenanceEmbed(maint, botColor))
      }
      embedsCollection.push(tmpEmbeds)

      for (const embeds of embedsCollection)
        await interaction.reply({ embeds: embeds })
    } else
      await interaction.reply({
        ephemeral: true,
        content: 'There is no active maintenance.'
      })
  }
}
