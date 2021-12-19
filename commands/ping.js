const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageActionRow, MessageButton } = require('discord.js')
const { getEmote } = require('../naagoLib/DiscordUtil')
const GlobalUtil = require('../naagoLib/GlobalUtil')
const NaagoUtil = require('../naagoLib/NaagoUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Bot's latency and uptime."),
  async execute(interaction) {
    const client = interaction.client
    const uptimeFormatted = NaagoUtil.convertMsToDigitalClock(client.uptime)

    await interaction.reply({
      content: `Ping to Websocket: \`${
        client.ws.ping
      } ms\`\nUptime: \`${uptimeFormatted}\`\nServer Count: \`${
        (
          await client.guilds.fetch()
        )?.size
      }\``,
      ephemeral: true
    })
  }
}
