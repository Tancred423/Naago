const {
  MessageAttachment,
  MessageActionRow,
  MessageButton
} = require('discord.js')
const DbUtil = require('./DbUtil')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const ProfileUtil = require('./ProfileUtil')

module.exports = class ContextMenuUtil {
  static async execute(interaction) {
    if (
      interaction.commandName === 'Add favorite' ||
      interaction.commandName === 'Remove favorite'
    ) {
      const invoker = interaction.user
      const target = interaction.options.getMember('user')

      const character = await DbUtil.getCharacter(target.id)

      if (!character) {
        const embed = DiscordUtil.getErrorEmbed(
          'This user does not have a verified character.'
        )

        await interaction.reply({
          embeds: [embed],
          ephemeral: true
        })

        return
      }

      if (interaction.commandName === 'Add favorite') {
        let successful = await DbUtil.addFavorite(
          invoker.id,
          character.id,
          character.name,
          character.server
        )

        if (successful === 'capped') {
          const embed = DiscordUtil.getErrorEmbed(
            `\`${character.name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.`
          )

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          })

          return
        }

        if (successful === 'existant') {
          const embed = DiscordUtil.getSuccessEmbed(
            `\`${character.name}\` is already a favorite.`
          )

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          })

          return
        }

        if (successful) {
          const embed = DiscordUtil.getSuccessEmbed(
            `\`${character.name}\` was added as favorite.`
          )

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          })
        } else {
          const embed = DiscordUtil.getErrorEmbed(
            `\`${character.name}\` could not be added to your favorites. Please contact Tancred#0001 for help.`
          )

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          })
        }
      } else if (interaction.commandName === 'Remove favorite') {
        const successful = await DbUtil.removeFavorite(invoker.id, character.id)

        if (successful === 'notfound') {
          const embed = DiscordUtil.getSuccessEmbed(
            `\`${character.name}\` is not a favorite already.`
          )

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          })

          return
        }

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            `\`${character.name}\` could not be removed from your favorites. Please contact Tancred#0001 for help.`
          )

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          `\`${character.name}\` has been removed from your favorites.`
        )

        await interaction.reply({
          embeds: [embed],
          ephemeral: true
        })
      }
    }
  }
}
