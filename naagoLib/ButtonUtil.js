const { MessageAttachment } = require('discord.js')
const { unfavoriteUser } = require('../commands/favorite')
const { unsetup } = require('../commands/setup')
const { verifyUser, unverifyUser } = require('../commands/verify')
const DbUtil = require('./DbUtil')
const DiscordUtil = require('./DiscordUtil')
const ProfileUtil = require('./profileUtil')

module.exports = class ButtonUtil {
  static async execute(interaction) {
    const userId = interaction.user.id
    const messageAuthorId = interaction.message.interaction?.user.id
    const buttonId = interaction.component.customId

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

    if (buttonId.startsWith('me')) {
      await interaction.deferUpdate()

      const verification = await DbUtil.getCharacterVerification(userId)

      if (verification?.is_verified) {
        // Get character
        const characterId = verification.character_id
        const character = await DbUtil.fetchCharacter(interaction, characterId)

        if (!character) {
          const embed = DiscordUtil.getErrorEmbed(
            `Could not fetch your character.\nPlease try again later.`
          )
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true
          })
          return
        }

        const buttonIdSplit = buttonId.split('-')
        if (buttonIdSplit.length !== 3)
          throw new Error('[/me - button] button id length is !== 3')

        let profilePage = buttonIdSplit[1]
        let subProfilePage
        if (profilePage === 'dowdom' || profilePage === 'dohdol') {
          subProfilePage = profilePage
          profilePage = 'classesjobs'
        } else if (profilePage === 'classesjobs' && !subProfilePage) {
          subProfilePage = 'dowdom'
        }

        // Update profile page
        DbUtil.updateProfilePage(userId, profilePage, subProfilePage)

        if (profilePage === 'socialmedia') {
          const profileEmbed = await ProfileUtil.getEmbed(
            interaction,
            character,
            true,
            profilePage,
            subProfilePage,
            true
          )

          const components = ProfileUtil.getComponents(
            profilePage,
            subProfilePage,
            'me',
            characterId
          )

          await interaction.message.edit({
            content: ' ',
            files: [],
            embeds: [profileEmbed],
            attachments: [],
            components: components
          })
        } else {
          const profileImage = await ProfileUtil.getImage(
            interaction,
            character,
            true,
            profilePage,
            subProfilePage
          )
          if (!profileImage) throw new Error('profileImage is undefined')

          const file = new MessageAttachment(profileImage)

          const components = ProfileUtil.getComponents(
            profilePage,
            subProfilePage,
            buttonIdSplit[0],
            characterId
          )

          await interaction.message.edit({
            content: ' ',
            files: [file],
            embeds: [],
            attachments: [],
            components: components
          })
        }
      }
    } else if (buttonId.startsWith('find')) {
      await interaction.deferUpdate()

      // Get character
      const buttonIdSplit = buttonId.split('-')
      if (buttonIdSplit.length !== 3) throw new Error()

      const characterId = buttonIdSplit[2]
      const character = await DbUtil.fetchCharacter(interaction, characterId)

      if (!character) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not fetch this character.\nPlease try again later.`
        )
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        })
        return
      }

      let profilePage = buttonIdSplit[1]
      let subProfilePage
      if (profilePage === 'dowdom' || profilePage === 'dohdol') {
        subProfilePage = profilePage
        profilePage = 'classesjobs'
      } else if (profilePage === 'classesjobs' && !subProfilePage) {
        subProfilePage = 'dowdom'
      }

      if (profilePage === 'socialmedia') {
        const profileEmbed = await ProfileUtil.getEmbed(
          interaction,
          character,
          false,
          profilePage,
          subProfilePage,
          false
        )

        const components = ProfileUtil.getComponents(
          profilePage,
          subProfilePage,
          'find',
          characterId
        )

        await interaction.message.edit({
          content: ' ',
          files: [],
          embeds: [profileEmbed],
          attachments: [],
          components: components
        })
      } else {
        const profileImage = await ProfileUtil.getImage(
          interaction,
          character,
          false,
          profilePage,
          subProfilePage
        )
        if (!profileImage) throw new Error('profileImage is undefined')

        const file = new MessageAttachment(profileImage)

        const components = ProfileUtil.getComponents(
          profilePage,
          subProfilePage,
          buttonIdSplit[0],
          characterId
        )

        await interaction.message.edit({
          content: ' ',
          files: [file],
          embeds: [],
          attachments: [],
          components: components
        })
      }
    } else if (buttonId.startsWith('verify')) {
      await interaction.deferReply({ ephemeral: true })
      verifyUser(interaction)
    } else if (buttonId.startsWith('unverify')) {
      await interaction.deferUpdate()
      unverifyUser(interaction)
    } else if (buttonId.startsWith('unfavorite')) {
      await interaction.deferUpdate()
      unfavoriteUser(interaction)
    } else if (buttonId.startsWith('unsetup')) {
      await interaction.deferUpdate()
      unsetup(interaction)
    }
  }
}
