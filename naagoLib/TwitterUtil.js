const { ETwitterStreamEvent } = require('twitter-api-v2')
const client = require('./twitter')
const moment = require('moment')
const { MessageEmbed } = require('discord.js')
const GlobalUtil = require('./GlobalUtil')
const {
  neededHashtags,
  twitterUsername,
  colorTwitter,
  twitterIconLink
} = require('../config.json')
const DbUtil = require('./DbUtil')

module.exports = class TwitterUtil {
  static async streamTweets() {
    // Get and delete old rules if needed
    const rules = await client.v2.streamRules()
    if (rules.data?.length) {
      await client.v2.updateStreamRules({
        delete: { ids: rules.data.map((rule) => rule.id) }
      })
    }

    // Add our rules
    await client.v2.updateStreamRules({
      add: [{ value: `from:${twitterUsername} has:images fashion report week` }]
    })

    GlobalUtil.stream = await client.v2.searchStream({
      'tweet.fields': [
        'referenced_tweets',
        'author_id',
        'attachments',
        'created_at',
        'entities'
      ],
      expansions: [
        'referenced_tweets.id',
        'attachments.media_keys',
        'author_id'
      ],
      'media.fields': ['preview_image_url', 'url'],
      'user.fields': ['profile_image_url', 'name', 'username', 'verified']
    })

    // Enable auto reconnect
    GlobalUtil.stream.autoReconnect = true

    console.log('Connected: Twitter')

    GlobalUtil.stream.on(ETwitterStreamEvent.Data, async (tweet) => {
      // Ignore RTs or Quote RTs
      if (tweet.data.referenced_tweets !== undefined) return

      // Check hashtags
      if (tweet.data.entities?.hashtags === undefined) return
      const hashtags = tweet.data.entities.hashtags.map((a) => a.tag)
      if (hashtags.sort().join(',') !== neededHashtags.sort().join(',')) return

      // Title
      const text = tweet.data.text
      const title = text.split('#')[0].trim()

      // Type
      if (!text.toLowerCase().includes('full details')) return

      // Week
      const week = text.match(/\d+/g)[0]

      // URL
      const url = tweet.includes?.media?.[0].url
      if (!url || tweet.includes?.media?.length > 1) return

      // Timestamp
      const createdAt = moment(tweet.createdAt).format('YYYY-MM-DD HH:mm:ss')

      // User
      if (tweet.includes?.users?.length > 1) return
      const user = tweet.includes?.users?.[0]

      const myTweet = {
        username: user.username,
        nickname: user.name,
        profileUrl: `https://twitter.com/${user.username}`,
        avatar: user.profile_image_url,
        verified: user.verified ?? false,
        tweetUrl: `https://twitter.com/${user.username}/status/${tweet.data.id}`,
        title: title,
        imageUrl: url,
        timestamp: createdAt,
        week: week
      }

      // Save data
      DbUtil.setFashionReportData(myTweet)

      // Send embeds
      const client = GlobalUtil.client
      if (!client) return
      const setups = await DbUtil.getSetups('fashion_report')
      if (!setups || setups?.length < 1) return

      for (const setup of setups) {
        try {
          const guild = await client.guilds.fetch(setup.guild_id)
          if (!guild) continue
          const channel = await guild.channels.fetch(setup.channel_id)
          if (!channel) continue

          const embed = new MessageEmbed()
            .setColor(colorTwitter)
            .setAuthor(
              `${myTweet.nickname}${myTweet.verified ? ' ✅' : ''} (@${
                myTweet.username
              })`,
              myTweet.avatar,
              myTweet.profileUrl
            )
            .setTitle(myTweet.title)
            .setURL(myTweet.tweetUrl)
            .setImage(myTweet.imageUrl)
            .setFooter('Twitter', twitterIconLink)
            .setTimestamp(myTweet.timestamp)

          await channel.send({ embeds: [embed] })
        } catch (err) {
          console.log(
            `[${moment().format(
              'YYYY-MM-DD HH:mm'
            )}] [TWITTER] Sending fashion report to ${
              setup.guild_id
            } was NOT successful: ${err.message}`
          )
          continue
        }
      }
    })
  }
}
