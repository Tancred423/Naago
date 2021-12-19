const { MessageEmbed, Permissions } = require('discord.js')
const { green, red, blurple } = require('../config.json')
const NaagoUtil = require('./NaagoUtil')
const { maintenanceIconLink } = require('../config.json')

module.exports = class DiscordUtil {
  static getSuccessEmbed(message) {
    return new MessageEmbed().setColor(green).setDescription(`✅ ${message}`)
  }

  static getErrorEmbed(message) {
    return new MessageEmbed().setColor(red).setDescription(`:x: ${message}`)
  }

  static async getBotColorByInteraction(interaction) {
    const botId = interaction.client.user.id
    const guild = interaction.guild
    if (!guild) return blurple
    const member = await guild.members.fetch(botId)
    if (!member) return blurple
    const displayHexColor = member.displayHexColor
    if (displayHexColor === '#000000') return blurple

    return displayHexColor
  }

  static async getBotColorByClientGuild(client, guild) {
    if (!client || !guild) return blurple
    const botId = client.user.id
    const member = await guild.members.fetch(botId)
    if (!member) return blurple
    const displayHexColor = member.displayHexColor
    if (displayHexColor === '#000000') return blurple

    return displayHexColor
  }

  static async getEmote(client, name) {
    const naagoEmoteServerId = '915541034220531772'
    const naagoEmoteServer = await client.guilds.fetch(naagoEmoteServerId)

    if (!naagoEmoteServer) return null

    if (name === 'github')
      return await naagoEmoteServer.emojis.fetch('921485435346251797')
    else if (name === 'instagram')
      return await naagoEmoteServer.emojis.fetch('921485626006700043')
    else if (name === 'reddit')
      return await naagoEmoteServer.emojis.fetch('921485728251260959')
    else if (name === 'spotify')
      return await naagoEmoteServer.emojis.fetch('921485793531408415')
    else if (name === 'steamcommunity')
      return await naagoEmoteServer.emojis.fetch('921485862506745857')
    else if (name === 'tiktok')
      return await naagoEmoteServer.emojis.fetch('921485973186031696')
    else if (name === 'twitch')
      return await naagoEmoteServer.emojis.fetch('915541076763365427')
    else if (name === 'youtube')
      return await naagoEmoteServer.emojis.fetch('915541076977254411')
    else if (name === 'twitter')
      return await naagoEmoteServer.emojis.fetch('915541076989861908')
    else if (name === 'loading')
      return await naagoEmoteServer.emojis.fetch('918998950885875762')
    else return null
  }

  static async hasAllPermissions(interaction, member, ...permissions) {
    let hasAllPermissions = true

    const neededPerms = new Permissions(permissions).toArray()
    const missingPermsTmp = []

    for (const permission of permissions) {
      if (!member.permissions.has(permission, true)) {
        hasAllPermissions = false
        missingPermsTmp.push(permission)
      }
    }

    const missingPerms = new Permissions(missingPermsTmp).toArray()

    if (hasAllPermissions) return true
    else {
      const embed = DiscordUtil.getErrorEmbed(
        'Not enough permissions to execute this command.'
      )
        .addField(
          'For this command you will need',
          NaagoUtil.prettifyPermissionArray(neededPerms, false)
        )
        .addField(
          'But you are missing',
          NaagoUtil.prettifyPermissionArray(missingPerms),
          false
        )

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      })

      return false
    }
  }

  static getMaintenanceEmbed(maint, botColor) {
    return new MessageEmbed()
      .setColor(botColor)
      .setAuthor(maint.tag, maintenanceIconLink, null)
      .setTitle(maint.title)
      .setURL(maint.link)
      .setDescription(maint.details)
      .setFooter('Posted at')
      .setTimestamp(maint.date)
  }
}
