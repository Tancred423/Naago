const { MessageEmbed } = require('discord.js')
const { green, red } = require('../config.json')

module.exports = class DiscordUtil {
  static getSuccessEmbed(message) {
    return new MessageEmbed().setColor(green).setDescription(`✅ ${message}`)
  }

  static getErrorEmbed(message) {
    return new MessageEmbed().setColor(red).setDescription(`:x: ${message}`)
  }

  static async getBotColor(interaction) {
    const botId = interaction.client.user.id
    const guild = interaction.guild
    if (!guild) return blurple
    const member = await guild.members.fetch(botId)
    if (!member) return blurple
    const displayHexColor = member.displayHexColor
    if (
      (displayHexColor && displayHexColor !== '#000000') ||
      (displayHexColor && member.roles.member._roles.length > 0)
    )
      return displayHexColor
    else return blurple
  }

  static async getEmote(client, name) {
    const naagoEmoteServerId = '915541034220531772'
    const naagoEmoteServer = await client.guilds.fetch(naagoEmoteServerId)

    if (!naagoEmoteServer) return null

    if (name === 'twitch') {
      return await naagoEmoteServer.emojis.fetch('915541076763365427')
    } else if (name === 'youtube') {
      return await naagoEmoteServer.emojis.fetch('915541076977254411')
    } else if (name === 'twitter') {
      return await naagoEmoteServer.emojis.fetch('915541076989861908')
    } else return null
  }
}
