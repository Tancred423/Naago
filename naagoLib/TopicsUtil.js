const axios = require('axios')
const { MessageEmbed } = require('discord.js')
const NaagoUtil = require('./NaagoUtil')
const DiscordUtil = require('./DiscordUtil')
const DbUtil = require('./DbUtil')
const GlobalUtil = require('./GlobalUtil')
const moment = require('moment')

module.exports = class TopicsUtil {
  static async getLast10() {
    try {
      const res = await axios.get('http://localhost:8081/lodestone/topics')
      return res?.data?.Topics ?? []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async updateDb() {
    console.log(
      `[${moment().format('YYYY-MM-DD HH:mm')}] Checking for topics/news`
    )

    const latestTopics = await this.getLast10()
    const newTopics = []

    for (const topic of latestTopics) {
      topic.date = topic.date * 1000
      if (await DbUtil.getTopicByTitle(topic.title, topic.date)) break

      // Enrich topic
      let markdown = NaagoUtil.topicHtmlToMarkdown(topic.description)
      const parsedMarkdown = NaagoUtil.parseImageLinkFromMarkdown(markdown)
      markdown = parsedMarkdown?.markdown
      topic.description = markdown
      const links = parsedMarkdown?.links
      topic.banner = links?.length === 1 ? links[0] : topic.banner

      newTopics.push(topic)
    }

    for (const newTopic of newTopics.reverse()) {
      DbUtil.addTopic(newTopic)
      await TopicsUtil.sentTopic(newTopic)
    }
  }

  static async sentTopic(topic) {
    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const tInfo = await DbUtil.getTopicInfo()
    if (!tInfo || tInfo?.length < 1) return

    for (const info of tInfo) {
      const guild = await client.guilds.fetch(info.guild_id)
      if (!guild) continue
      const channel = await guild.channels.fetch(info.channel_id)
      if (!channel) continue

      const botColor = await DiscordUtil.getBotColorByClientGuild(client, guild)
      const embed = DiscordUtil.getTopicEmbed(topic, botColor)

      await channel.send({ embeds: [embed] })
    }
  }
}
