const {
  MessageAttachment,
  MessageActionRow,
  MessageButton
} = require('discord.js')
const DbUtil = require('./DbUtil')
const DiscordUtil = require('./DiscordUtil')
const ProfileUtil = require('./ProfileUtil')

module.exports = class SelectMenuUtil {
  static async execute(interaction) {
    const userId = interaction.user.id
    const messageAuthorId = interaction.message.interaction?.user.id

    if (userId !== messageAuthorId) {
      const embed = DiscordUtil.getErrorEmbed(
        'You cannot interact with commands from someone else.'
      )
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      })
      return
    }

    if (interaction.customId === 'theme') {
      await interaction.deferUpdate()

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
    } else if (interaction.customId === 'favorite.get') {
      await interaction.deferUpdate()

      const characterId = interaction.values[0]
      const character = await DbUtil.fetchCharacter(interaction, characterId)

      if (!character) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`
        )
        await interaction.deleteReply()
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        })
      } else {
        try {
          const profileImage = await ProfileUtil.getImage(
            interaction,
            character,
            false,
            'profile'
          )
          if (!profileImage)
            throw new Error('[/favorite] profileImage is undefined')

          const file = new MessageAttachment(profileImage)

          const components = ProfileUtil.getComponents(
            'profile',
            null,
            'find',
            characterId
          )

          await interaction.editReply({
            content: ' ',
            files: [file],
            embeds: [],
            attachments: [],
            components: components
          })
        } catch (error) {
          console.error(error)

          await interaction.deleteReply()
          await interaction.followUp({
            embeds: [
              DiscordUtil.getErrorEmbed(
                'There was an error while executing this command.'
              )
            ],
            ephemeral: true
          })
        }
      }
    } else if (interaction.customId === 'favorite.remove') {
      await interaction.deferUpdate()

      const characterId = interaction.values[0]
      const characterName =
        interaction.message.components[0].components[0].options.find(
          (o) => o.value === characterId
        )?.label ?? characterId

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('unfavorite.cancel')
          .setLabel('No, cancel.')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(`unfavorite.${characterId}.${characterName}`)
          .setLabel('Yes, remove them.')
          .setStyle('DANGER')
      )

      await interaction.editReply({
        content: `Are you sure you want to remove \`${characterName}\` from your favorites?`,
        components: [row]
      })
    }
  }
}
