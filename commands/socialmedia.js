const { SlashCommandBuilder } = require('@discordjs/builders')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const mysql = require('../naagoLib/mysql')
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
            .addChoice('Twitch', 'twitch')
            .addChoice('YouTube', 'youtube')
            .addChoice('Twitter', 'twitter')
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
            .addChoice('Twitch', 'twitch')
            .addChoice('YouTube', 'youtube')
            .addChoice('Twitter', 'twitter')
        )
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })

    if (interaction.options.getSubcommand() === 'add') {
      const platform = interaction.options.getString('platform').toLowerCase()
      const url = interaction.options.getString('url').toLowerCase()
      const userId = interaction.user.id

      // Get character ID
      const sql = `
        SELECT *
        FROM verify
        WHERE user_id=${mysql.escape(userId)}
      `
      const verify = await DbUtil.getMysqlResult(sql)

      if (verify) {
        // Check url
        const urlString = url.replace('www.', '')
        try {
          const urlObject = new URL(urlString)
          const hostnameSplit = urlObject.hostname.split('.')
          const domain = hostnameSplit.slice(hostnameSplit.length - 2)[0]
          if (domain !== platform) {
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
        const characterId = verify.character_id

        DbUtil.addSocialMedia(characterId, platform, urlString)

        await interaction.editReply({
          embeds: [
            DiscordUtil.getSuccessEmbed(
              `Your \`${platform}\` URL was set to \`${urlString}\`!`
            )
          ]
        })
      } else {
        const embed = DiscordUtil.getErrorEmbed(
          'Please verify your character first. You can do so with `/verify`.'
        )
        await interaction.editReply({ embeds: [embed] })
      }
    } else {
      const platform = interaction.options.getString('platform').toLowerCase()
      const userId = interaction.user.id

      // Get character ID
      const sql = `
        SELECT *
        FROM verify
        WHERE user_id=${mysql.escape(userId)}
      `
      const verify = await DbUtil.getMysqlResult(sql)

      if (verify) {
        // Get character
        const characterId = verify.character_id

        DbUtil.removeSocialMedia(characterId, platform)

        await interaction.editReply({
          embeds: [
            DiscordUtil.getSuccessEmbed(
              `Your \`${platform}\` URL has been removed!`
            )
          ]
        })
      } else {
        const embed = DiscordUtil.getErrorEmbed(
          'Please verify your character first. You can do so with `/verify`.'
        )
        await interaction.editReply({ embeds: [embed] })
      }
    }
  }
}
