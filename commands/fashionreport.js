const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const moment = require('moment')
const { colorTwitter, twitterIconLink } = require('../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fashionreport')
    .setDescription('Latest fashion report details.'),
  async execute(interaction) {
    const myTweet = await DbUtil.getFashionReportData()

    // Check if report is from this week
    const now = moment()
    const cwNow = now.week()
    const tweetTime = moment(myTweet?.timestamp)
    let cwTweet = tweetTime?.week()
    if (tweetTime?.day() === 1) cwTweet === 1 ? (cwTweet = 52) : (cwTweet -= 1)
    const isFromThisWeek = cwTweet === cwNow

    // Only output data from the current week
    if (!myTweet || !isFromThisWeek) {
      const embed = DiscordUtil.getErrorEmbed(
        'No fashion report data found for this week (yet).'
      )

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      })

      return
    }

    // Output data
    const embed = new MessageEmbed()
      .setColor(colorTwitter)
      .setAuthor(
        `${myTweet.nickname}${myTweet.verified ? ' ✅' : ''} (@${
          myTweet.username
        })`,
        myTweet.avatar,
        myTweet.profile_url
      )
      .setTitle(myTweet.title)
      .setURL(myTweet.tweet_url)
      .setImage(myTweet.image_url)
      .setFooter('Twitter', twitterIconLink)
      .setTimestamp(myTweet.timestamp)

    await interaction.reply({
      embeds: [embed]
    })
  }
}
