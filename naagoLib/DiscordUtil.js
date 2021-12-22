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
  statusIconLink
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
    else if (name === 'theme_dark') {
      return await naagoEmoteServer.emojis.fetch('922677850543357982')
    } else if (name === 'theme_light') {
      return await naagoEmoteServer.emojis.fetch('922677850480467979')
    } else if (name === 'theme_classic') {
      return await naagoEmoteServer.emojis.fetch('922677850522390529')
    } else if (name === 'theme_final_days') {
      return await naagoEmoteServer.emojis.fetch('922681780606230629')
    } else if (name === 'theme_ultima_thule') {
      return await naagoEmoteServer.emojis.fetch('922689049569931304')
    } else if (name === 'theme_moon') {
      return await naagoEmoteServer.emojis.fetch('922689049569931304')
    } else if (name === 'theme_amaurot') {
      return await naagoEmoteServer.emojis.fetch('922699017337597952')
    } else if (name === 'theme_character_selection') {
      return await naagoEmoteServer.emojis.fetch('922709333639311422')
    } else if (name === 'maintenances') {
      return await naagoEmoteServer.emojis.fetch('922959045193793557')
    } else if (name === 'notices') {
      return await naagoEmoteServer.emojis.fetch('922959045256679444')
    } else if (name === 'status') {
      return await naagoEmoteServer.emojis.fetch('922959045378326578')
    } else if (name === 'topics') {
      return await naagoEmoteServer.emojis.fetch('922959045277650994')
    } else if (name === 'updates') {
      return await naagoEmoteServer.emojis.fetch('922959045466398770')
    } else return null
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
      .setFooter('Posted on', lodestoneIconLink)
      .setTimestamp(topic.date)
  }

  static getNoticesEmbed(notice) {
    return new MessageEmbed()
      .setColor(colorNotices)
      .setAuthor(notice.tag, noticeIconLink)
      .setTitle(notice.title)
      .setURL(notice.link)
      .setDescription(notice.details)
      .setFooter('Posted on', lodestoneIconLink)
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
      .setFooter('Posted on', lodestoneIconLink)
      .setTimestamp(maint.date)
  }

  static getUpdatesEmbed(update) {
    return new MessageEmbed()
      .setColor(colorUpdates)
      .setAuthor('Update', updateIconLink)
      .setTitle(update.title)
      .setURL(update.link)
      .setDescription(update.details)
      .setFooter('Posted on', lodestoneIconLink)
      .setTimestamp(update.date)
  }

  static getStatusEmbed(status) {
    return new MessageEmbed()
      .setColor(colorStatus)
      .setAuthor(status.tag, statusIconLink)
      .setTitle(status.title)
      .setURL(status.link)
      .setDescription(status.details)
      .setFooter('Posted on', lodestoneIconLink)
      .setTimestamp(status.date)
  }
}
