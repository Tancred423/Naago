const { SlashCommandBuilder } = require('@discordjs/builders')

const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const mysql = require('../naagoLib/mysql')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('theme')
    .setDescription(
      'Change the theme for your profile to dark, light or classic (blue).'
    )
    .addStringOption((option) =>
      option
        .setName('theme')
        .setDescription('Which theme do you prefer?')
        .setRequired(true)
        .addChoice('Dark', 'dark')
        .addChoice('Light', 'light')
        .addChoice('Classic (Blue)', 'classic')
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true })

    const theme = interaction.options.getString('theme').toLowerCase()
    const userId = interaction.user.id

    const verification = DbUtil.getCharacterVerification(userId)

    if (verification) {
      await DbUtil.setTheme(userId, theme)

      await interaction.editReply({
        embeds: [
          DiscordUtil.getSuccessEmbed(`Your theme was set to \`${theme}\`!`)
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
