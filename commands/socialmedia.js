const { SlashCommandBuilder } = require('@discordjs/builders')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const NaagoUtil = require('../naagoLib/NaagoUtil')
const URL = require('url').URL

module.exports = {
  data: new SlashCommandBuilder()
    .setName('socialmedia')
    .setDescription('Manage social media links on your profile.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add social media links to your profile.')
        .addStringOption((option) =>
          option
            .setName('platform')
            .setDescription('The social media platform.')
            .setRequired(true)
            .addChoice('GitHub', 'github.com')
            .addChoice('Instagram', 'instagram.com')
            .addChoice('Reddit', 'reddit.com')
            .addChoice('Spotify', 'spotify.com')
            .addChoice('Steam', 'steamcommunity.com')
            .addChoice('TikTok', 'tiktok.com')
            .addChoice('Twitch', 'twitch.tv')
            .addChoice('Twitter', 'twitter.com')
            .addChoice('YouTube', 'youtube.com')
        )
        .addStringOption((option) =>
          option
            .setName('url')
            .setDescription('The URL to your social media profile.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove social media links from your profile.')
        .addStringOption((option) =>
          option
            .setName('platform')
            .setDescription('The social media platform.')
            .setRequired(true)
            .addChoice('GitHub', 'github.com')
            .addChoice('Instagram', 'instagram.com')
            .addChoice('Reddit', 'reddit.com')
            .addChoice('Spotify', 'spotify.com')
            .addChoice('Steam', 'steamcommunity.com')
            .addChoice('TikTok', 'tiktok.com')
            .addChoice('Twitch', 'twitch.tv')
            .addChoice('Twitter', 'twitter.com')
            .addChoice('YouTube', 'youtube.com')
        )
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })

    if (interaction.options.getSubcommand() === 'add') {
      const platform = interaction.options.getString('platform').toLowerCase()
      const url = interaction.options.getString('url').toLowerCase()
      const userId = interaction.user.id
      const verification = await DbUtil.getCharacterVerification(userId)
      const websiteName = NaagoUtil.getWebsiteName(platform)

      if (verification?.is_verified) {
        // Check url
        const urlString = url.replace('www.', '')
        try {
          const urlObject = new URL(urlString)
          const hostname = urlObject.hostname.split('.').slice(-2).join('.')
          if (hostname !== platform) {
            throw new Error()
          }
        } catch (err) {
          const embed = DiscordUtil.getErrorEmbed(
            `The provided url is not from \`${platform}\`.`
          )
          await interaction.editReply({ embeds: [embed] })
          return
        }

        // Get character
        const characterId = verification.character_id

        const successful = await DbUtil.addSocialMedia(
          characterId,
          platform,
          urlString
        )

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            `The ${websiteName} URL could not be added. Please contact Tancred#0001 for help.`
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          `Your ${websiteName} URL was set to \`${urlString}\`!`
        )

        await interaction.editReply({
          embeds: [embed]
        })
      } else {
        const embed = DiscordUtil.getErrorEmbed(
          'Please verify your character first. See `/verify set`.'
        )
        await interaction.editReply({ embeds: [embed] })
      }
    } else {
      const platform = interaction.options.getString('platform').toLowerCase()
      const userId = interaction.user.id
      const verification = await DbUtil.getCharacterVerification(userId)

      if (verification?.is_verified) {
        // Get character
        const characterId = verification.character_id

        const successful = await DbUtil.removeSocialMedia(characterId, platform)

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            `\`${platform}\` URL could not be removed. Please contact Tancred#0001 for help.`
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          `Your \`${platform}\` URL has been removed.`
        )

        await interaction.editReply({
          embeds: [embed]
        })
      } else {
        const embed = DiscordUtil.getErrorEmbed(
          'Please verify your character first. See `/verify set`.'
        )
        await interaction.editReply({ embeds: [embed] })
      }
    }
  }
}
