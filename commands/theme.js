const { SlashCommandBuilder } = require('@discordjs/builders')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const { MessageActionRow, MessageSelectMenu } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('theme')
    .setDescription('Change the theme of the profiles you request.'),
  async execute(interaction) {
    const userId = interaction.user.id
    const verification = await DbUtil.getCharacterVerification(userId)

    if (!verification?.is_verified) {
      const embed = DiscordUtil.getErrorEmbed(
        'Please verify your character first. See `/verify set`.'
      )
      await interaction.reply({ ephemeral: true, embeds: [embed] })
      return
    }

    await interaction.deferReply({ ephemeral: true })

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('theme')
        .setPlaceholder('Select a theme...')
        .addOptions([
          {
            label: 'Dark UI',
            description: 'The dark UI as in-game',
            value: 'dark'
          },
          {
            label: 'Light UI',
            description: 'The light UI as in-game',
            value: 'light'
          },
          {
            label: 'Classic UI',
            description: 'The classic (blue) UI as in-game',
            value: 'classic'
          }
        ])
    )

    await interaction.editReply({
      content: 'Which theme do you prefer?',
      components: [row]
    })
  }
}
