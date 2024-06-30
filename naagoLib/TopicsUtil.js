const axios = require('axios')
const NaagoUtil = require('./NaagoUtil')
const DiscordUtil = require('./DiscordUtil')
const DbUtil = require('./DbUtil')
const GlobalUtil = require('./GlobalUtil')
const Parser = require('./LodestoneParser')
const moment = require('moment')
const {
  naagostonePort,
  saveLodestoneNews,
  sendLodestoneNews,
} = require('../config.json')

module.exports = class TopicsUtil {
  static async getLast10() {
    try {
      const res = await axios.get(
        `http://localhost:${naagostonePort}/lodestone/topics`,
      )
      return res?.data?.Topics ?? []
    } catch (err) {
      console.log(`Getting topics failed: ${err.message}`)
      return []
    }
  }

  static async updateDb() {
    const latestTopics = await this.getLast10()
    const newTopics = []

    for (const topic of latestTopics) {
      if (!topic) continue

      topic.title = Parser.decodeHtmlChars(topic.title)
      topic.date = Parser.convertTimestampToMs(topic.date)

      // Only process new ones
      if (await DbUtil.getTopicByTitle(topic.title, topic.date)) continue

      // Description
      topic.description = Parser.decodeHtmlChars(topic.description)
      topic.description = Parser.convertHtmlToMarkdown(topic.description)
      topic.description = Parser.convertTitles(topic.description)
      const imageLinks = Parser.convertImageLinks(topic.description)
      topic.description = imageLinks.description
      topic.description = Parser.convertDates('topics', topic.description)
      topic.description = NaagoUtil.cutString(
        topic.description,
        2000,
        topic.link,
      )

      // Image
      if (imageLinks.links.length === 1) topic.banner = imageLinks.links[0]

      newTopics.push(topic)
    }

    for (const newTopic of newTopics.reverse()) {
      if (saveLodestoneNews) DbUtil.addTopic(newTopic)
      if (sendLodestoneNews) await TopicsUtil.sentTopic(newTopic)
    }

    return newTopics.length
  }

  static async sentTopic(topic) {
    // Send embeds
    const client = GlobalUtil.client

    if (!client) {
      console.log(
        `[${moment().format(
          'YYYY-MM-DD HH:mm',
        )}] [TOPICS] Sending topics was NOT successful because client is null!`,
      )

      return
    }

    const setups = await DbUtil.getSetups('topics')

    if (!setups || setups?.length < 1) {
      console.log(
        `[${moment().format(
          'YYYY-MM-DD HH:mm',
        )}] [TOPICS] Sending topics was NOT successful because setups cannot be found! | Is setups null: ${!setups} | Is setups not null but empty: ${
          setups?.length < 1 ? 'null...' : setups?.length
        }`,
      )

      return
    }

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id)

        if (!guild) {
          console.log(
            `[${moment().format(
              'YYYY-MM-DD HH:mm',
            )}] [TOPICS] Sending topic to ${
              setup.guild_id
            } was NOT successful because could not fetch guild.`,
          )

          continue
        }

        const channel = await guild.channels.fetch(setup.channel_id)

        if (!channel) {
          console.log(
            `[${moment().format(
              'YYYY-MM-DD HH:mm',
            )}] [TOPICS] Sending topic to ${
              setup.guild_id
            } was NOT successful because could not fetch channel with id ${
              setup.channel_id
            }.`,
          )

          continue
        }

        const embed = DiscordUtil.getTopicEmbed(topic)

        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.log(
          `[${moment().format('YYYY-MM-DD HH:mm')}] [TOPICS] Sending topic to ${
            setup.guild_id
          } was NOT successful: ${err.message}`,
          err,
        )

        continue
      }
    }
  }
}
