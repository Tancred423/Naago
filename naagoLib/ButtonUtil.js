const Favorite = require('../commands/favorite')
const Me = require('../commands/me')
const Find = require('../commands/find')
const Setup = require('../commands/setup')
const Verify = require('../commands/verify')
const DiscordUtil = require('./DiscordUtil')
const HelpUtil = require('./HelpUtil')
const NaagoUtil = require('./NaagoUtil')

module.exports = class ButtonUtil {
  static cooldown = []

  static async execute(interaction) {
    const userId = interaction.user.id
    const messageAuthorId = interaction.message.interaction?.user.id

    const isOnCooldown = this.cooldown.includes(userId)
    if (isOnCooldown) {
      await interaction.deferUpdate()
      return
    }
    this.cooldown.push(userId)

    setTimeout(() => {
      NaagoUtil.removeItemFromArray(this.cooldown, userId)
    }, 1000)

    if (userId !== messageAuthorId) {
      await interaction.deferUpdate()
      const embed = DiscordUtil.getErrorEmbed(
        'You cannot interact with commands from someone else.'
      )
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true
      })
      return
    }

    const buttonId = interaction.component.customId
    const buttonIdSplit = buttonId.split('.')
    const commandName = buttonIdSplit[0]
    const action = buttonIdSplit[1]

    switch (commandName) {
      case 'me':
        await interaction.deferUpdate()
        await Me.update(interaction, buttonIdSplit)
        break
      case 'find':
        await interaction.deferUpdate()
        await Find.update(interaction, buttonIdSplit)
        break
      case 'verify':
        switch (action) {
          case 'unset':
            await interaction.deferUpdate()
            await Verify.unverify(interaction, buttonIdSplit)
            break
          default:
            await interaction.deferReply({ ephemeral: true })
            await Verify.verify(interaction, buttonIdSplit)
            break
        }
        break
      case 'favorite':
        switch (action) {
          case 'unset':
            await interaction.deferUpdate()
            await Favorite.confirmRemove(interaction, buttonIdSplit)
            break
          default:
            throw new Error("favorite - button: action was not 'unset'")
        }
        break
      case 'setup':
        switch (action) {
          case 'unset':
            await interaction.deferUpdate()
            await Setup.unset(interaction, buttonIdSplit)
            break
          case 'purge':
            await interaction.deferUpdate()
            await Setup.purge(interaction, buttonIdSplit)
            break
          default:
            throw new Error("setup - button: action was not 'unset'")
        }
        break
      case 'help':
        await interaction.deferUpdate()
        await HelpUtil.update(interaction, buttonIdSplit)
        break
    }
  }
}
