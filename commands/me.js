const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const ProfileUtil = require('../naagoLib/ProfileUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('me')
    .setDescription("Your verified character's FFXIV profile."),
  async execute(interaction) {
    await interaction.deferReply()

    const userId = interaction.user.id
    const verification = await DbUtil.getCharacterVerification(userId)

    if (!verification?.is_verified) {
      const embed = DiscordUtil.getErrorEmbed(
        'Please verify your character first. See `/verify set`.'
      )
      await interaction.editReply({ embeds: [embed] })
      return
    }

    const characterId = verification.character_id
    const character = await DbUtil.fetchCharacter(interaction, characterId)

    if (!character) {
      const embed = DiscordUtil.getErrorEmbed(
        `Could not fetch your character.\nPlease try again later.`
      )
      await interaction.editReply({
        embeds: [embed]
      })
      return
    }

    const profilePages = await DbUtil.getProfilePages(userId)
    const profilePage = profilePages.profilePage ?? 'profile'
    const subProfilePage = profilePages.subProfilePage

    try {
      if (!profilePage) throw new Error('[/me] profilePage is undefined')

      if (profilePage === 'socialmedia') {
        const profileEmbed = await ProfileUtil.getEmbed(
          interaction,
          character,
          true,
          profilePage,
          true
        )
        if (!profileEmbed) throw new Error('[/me] profileEmbed is undefined')

        const components = ProfileUtil.getComponents(
          profilePage,
          subProfilePage,
          'me',
          characterId
        )

        await interaction.editReply({
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
        if (!profileImage) throw new Error('[/me] profileImage is undefined')

        const file = new MessageAttachment(profileImage)

        const components = ProfileUtil.getComponents(
          profilePage,
          subProfilePage,
          'me',
          characterId
        )

        await interaction.editReply({
          content: ' ',
          files: [file],
          embeds: [],
          attachments: [],
          components: components
        })
      }
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
}
