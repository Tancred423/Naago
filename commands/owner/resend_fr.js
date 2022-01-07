const { SlashCommandBuilder } = require('@discordjs/builders')
const DbUtil = require('../../naagoLib/DbUtil')
const DiscordUtil = require('../../naagoLib/DiscordUtil')
const GlobalUtil = require('../../naagoLib/GlobalUtil')
const { colorTwitter, twitterIconLink } = require('../../config.json')
const { MessageEmbed } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resend_fr')
    .setDescription('Resend the last fashion report.')
    .setDefaultPermission(false),
  permissions: [
    {
      id: '181896377486278657',
      type: 'USER',
      permission: true
    }
  ],
  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true
    })

    const tweet = await DbUtil.getFashionReportData()

    // Send embeds
    const client = GlobalUtil.client
    if (!client) return
    const setups = await DbUtil.getSetups('fashion_report')
    if (!setups || setups?.length < 1) return

    for (const setup of setups) {
      const guild = await client.guilds.fetch(setup.guild_id)
      if (!guild) continue
      const channel = await guild.channels.fetch(setup.channel_id)
      if (!channel) continue

      const embed = new MessageEmbed()
        .setColor(colorTwitter)
        .setAuthor(
          `${tweet.nickname}${tweet.verified ? ' ✅' : ''} (@${
            tweet.username
          })`,
          tweet.avatar,
          tweet.profile_url
        )
        .setTitle(tweet.title)
        .setURL(tweet.tweet_url)
        .setImage(tweet.image_url)
        .setFooter('Twitter', twitterIconLink)
        .setTimestamp(tweet.timestamp)

      await channel.send({ embeds: [embed] })
    }

    await interaction.editReply({
      embeds: [
        DiscordUtil.getSuccessEmbed('All fashion report messages were send.')
      ]
    })
  }
}
