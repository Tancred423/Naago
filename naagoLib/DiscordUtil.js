const { MessageEmbed, Permissions } = require('discord.js')
const {
  green,
  red,
  blurple,
  colorTopics,
  colorNotices,
  colorMaintenances,
  colorUpdates,
  colorStatus,
  topicIconLink,
  noticeIconLink,
  maintenanceIconLink,
  updateIconLink,
  statusIconLink,
  lodestoneIconLink
} = require('../config.json')
const NaagoUtil = require('./NaagoUtil')

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

    switch (name) {
      case 'github':
        return await naagoEmoteServer.emojis.fetch('921485435346251797')
      case 'instagram':
        return await naagoEmoteServer.emojis.fetch('921485626006700043')
      case 'reddit':
        return await naagoEmoteServer.emojis.fetch('921485728251260959')
      case 'spotify':
        return await naagoEmoteServer.emojis.fetch('921485793531408415')
      case 'steamcommunity':
        return await naagoEmoteServer.emojis.fetch('921485862506745857')
      case 'tiktok':
        return await naagoEmoteServer.emojis.fetch('921485973186031696')
      case 'twitch':
        return await naagoEmoteServer.emojis.fetch('915541076763365427')
      case 'youtube':
        return await naagoEmoteServer.emojis.fetch('915541076977254411')
      case 'twitter':
        return await naagoEmoteServer.emojis.fetch('915541076989861908')
      case 'loading':
        return await naagoEmoteServer.emojis.fetch('918998950885875762')
      case 'theme_dark':
        return await naagoEmoteServer.emojis.fetch('922677850543357982')
      case 'theme_light':
        return await naagoEmoteServer.emojis.fetch('922677850480467979')
      case 'theme_classic':
        return await naagoEmoteServer.emojis.fetch('922677850522390529')
      case 'theme_final_days':
        return await naagoEmoteServer.emojis.fetch('922681780606230629')
      case 'theme_ultima_thule':
        return await naagoEmoteServer.emojis.fetch('932065506343657502')
      case 'theme_moon':
        return await naagoEmoteServer.emojis.fetch('922718025654886400')
      case 'theme_amaurot':
        return await naagoEmoteServer.emojis.fetch('922699017337597952')
      case 'theme_character_selection':
        return await naagoEmoteServer.emojis.fetch('922709333639311422')
      case 'maintenances':
        return await naagoEmoteServer.emojis.fetch('922959045193793557')
      case 'notices':
        return await naagoEmoteServer.emojis.fetch('922959045256679444')
      case 'status':
        return await naagoEmoteServer.emojis.fetch('922959045378326578')
      case 'topics':
        return await naagoEmoteServer.emojis.fetch('922959045277650994')
      case 'updates':
        return await naagoEmoteServer.emojis.fetch('922959045466398770')
      case 'doggo_smile':
        return await naagoEmoteServer.emojis.fetch('924901318718521415')
      default:
        return null
    }
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

  static getTopicEmbed(topic) {
    return new MessageEmbed()
      .setColor(colorTopics)
      .setAuthor('Topic', topicIconLink)
      .setTitle(topic.title)
      .setURL(topic.link)
      .setDescription(topic.description)
      .setImage(topic.banner)
      .setFooter('Lodestone', lodestoneIconLink)
      .setTimestamp(topic.date)
  }

  static getNoticesEmbed(notice) {
    return new MessageEmbed()
      .setColor(colorNotices)
      .setAuthor(notice.tag, noticeIconLink)
      .setTitle(notice.title)
      .setURL(notice.link)
      .setDescription(notice.details)
      .setFooter('Lodestone', lodestoneIconLink)
      .setTimestamp(notice.date)
  }

  static getMaintenanceEmbed(maint) {
    return new MessageEmbed()
      .setColor(colorMaintenances)
      .setAuthor(
        maint.tag === 'Maintenance' ? maint.tag : `Maintenance: ${maint.tag}`,
        maintenanceIconLink
      )
      .setTitle(maint.title)
      .setURL(maint.link)
      .setDescription(maint.details)
      .setFooter('Lodestone', lodestoneIconLink)
      .setTimestamp(maint.date)
  }

  static getUpdatesEmbed(update) {
    return new MessageEmbed()
      .setColor(colorUpdates)
      .setAuthor('Update', updateIconLink)
      .setTitle(update.title)
      .setURL(update.link)
      .setDescription(update.details)
      .setFooter('Lodestone', lodestoneIconLink)
      .setTimestamp(update.date)
  }

  static getStatusEmbed(status) {
    return new MessageEmbed()
      .setColor(colorStatus)
      .setAuthor(status.tag, statusIconLink)
      .setTitle(status.title)
      .setURL(status.link)
      .setDescription(status.details)
      .setFooter('Lodestone', lodestoneIconLink)
      .setTimestamp(status.date)
  }
}
