const { SlashCommandBuilder } = require('@discordjs/builders')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const { MessageActionRow, MessageSelectMenu } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('theme')
    .setDescription('Change the theme of the profiles you request.'),
  async execute(interaction) {
    const client = interaction.client
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
            description: 'The dark UI like in-game',
            value: 'dark',
            emoji: await DiscordUtil.getEmote(client, 'theme_dark')
          },
          {
            label: 'Light UI',
            description: 'The light UI like in-game',
            value: 'light',
            emoji: await DiscordUtil.getEmote(client, 'theme_light')
          },
          {
            label: 'Classic UI',
            description: 'The classic UI like in-game',
            value: 'classic',
            emoji: await DiscordUtil.getEmote(client, 'theme_classic')
          },
          {
            label: 'Character Selection',
            description: 'Background from character selection',
            value: 'character_selection',
            emoji: await DiscordUtil.getEmote(
              client,
              'theme_character_selection'
            )
          },
          {
            label: 'Amaurot',
            description: 'Amaurot projection from the Tempest',
            value: 'amaurot',
            emoji: await DiscordUtil.getEmote(client, 'theme_amaurot')
          },
          {
            label: 'The Moon',
            description: 'Landscape on Mare Lamentorum',
            value: 'moon',
            emoji: await DiscordUtil.getEmote(client, 'theme_moon')
          },
          {
            label: 'The Final Days',
            description: 'Fiery star showers',
            value: 'final_days',
            emoji: await DiscordUtil.getEmote(client, 'theme_final_days')
          },
          {
            label: 'Ultima Thule',
            description: 'At the edge of the universe',
            value: 'ultima_thule',
            emoji: await DiscordUtil.getEmote(client, 'theme_ultima_thule')
          }
        ])
    )

    await interaction.editReply({
      content: 'Which theme do you prefer?',
      components: [row]
    })
  },

  async update(interaction) {
    const userId = interaction.user.id
    const theme = interaction.values[0]
    const themeName =
      interaction.message.components[0].components[0].options.find(
        (o) => o.value === theme
      )?.label ?? theme

    const successful = await DbUtil.setTheme(userId, theme)

    if (!successful) {
      const embed = DiscordUtil.getErrorEmbed(
        `Theme could not be set to \`${themeName}\`. Please contact Tancred#0001 for help.`
      )

      interaction.editReply({
        content: ' ',
        components: [],
        embeds: [embed]
      })

      return
    }

    const embed = DiscordUtil.getSuccessEmbed(
      `Your theme was set to \`${themeName}\`.`
    )

    interaction.editReply({
      content: ' ',
      components: [],
      embeds: [embed]
    })
  }
}
