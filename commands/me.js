const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const ProfileUtil = require('../naagoLib/ProfileUtil')
const axios = require('axios')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('me')
    .setDescription("Your verified character's FFXIV profile."),
  async execute(interaction) {
    const userId = interaction.user.id
    const verification = await DbUtil.getCharacterVerification(userId)

    if (!verification?.is_verified) {
      const embed = DiscordUtil.getErrorEmbed(
        'Please verify your character first. See `/verify set`.',
      )
      await interaction.reply({ ephemeral: true, embeds: [embed] })
      return
    }

    await interaction.deferReply()

    const characterId = verification.character_id
    const characterDataDto = await DbUtil.fetchCharacter(
      interaction,
      characterId,
    )
    const character = characterDataDto.characterData

    if (!characterDataDto || !character) {
      const embed = DiscordUtil.getErrorEmbed(
        `Could not fetch your character.\nPlease try again later.`,
      )
      await interaction.deleteReply()
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      })
      return
    }

    const profilePages = await DbUtil.getProfilePages(userId)
    let profilePage = profilePages.profilePage ?? 'profile'
    if (profilePage === 'socialmedia') profilePage = 'profile'
    const subProfilePage = profilePages.subProfilePage

    if (!profilePage) throw new Error('[/me] profilePage is undefined')

    if (profilePage === 'portrait') {
      const response = await axios.get(character.portrait, {
        responseType: 'arraybuffer',
      })
      const buffer = Buffer.from(response.data, 'utf-8')
      const file = new MessageAttachment(buffer)

      const components = ProfileUtil.getComponents(
        profilePage,
        subProfilePage,
        'me',
        characterId,
      )

      await interaction.editReply({
        content: `${character.name}🌸${character.server.world}`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      })
    } else {
      const profileImage = await ProfileUtil.getImage(
        interaction,
        character,
        true,
        profilePage,
        subProfilePage,
      )
      if (!profileImage) throw new Error('[/me] profileImage is undefined')

      const file = new MessageAttachment(profileImage)

      const components = ProfileUtil.getComponents(
        profilePage,
        subProfilePage,
        'me',
        characterId,
      )

      await interaction.editReply({
        content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      })
    }
  },

  async update(interaction, buttonIdSplit) {
    const userId = interaction.user.id
    const verification = await DbUtil.getCharacterVerification(userId)

    if (verification?.is_verified) {
      // Get character
      const characterId = verification.character_id
      const characterDataDto = await DbUtil.fetchCharacterCached(
        interaction,
        characterId,
      )
      const character = characterDataDto.characterData

      if (!characterDataDto) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`,
        )
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        })
        return
      }

      if (buttonIdSplit.length !== 3)
        throw new Error('[/me - button] button id length is !== 3')

      let profilePage = buttonIdSplit[1]
      let subProfilePage
      if (profilePage === 'dowdom' || profilePage === 'dohdol') {
        subProfilePage = profilePage
        profilePage = 'classesjobs'
      } else if (profilePage === 'classesjobs' && !subProfilePage) {
        subProfilePage = 'dowdom'
      } else if (profilePage === 'socialmedia') {
        profilePage = 'profile'
      }

      // Update profile page
      DbUtil.updateProfilePage(userId, profilePage, subProfilePage)

      if (profilePage === 'portrait') {
        const response = await axios.get(character.portrait, {
          responseType: 'arraybuffer',
        })
        const buffer = Buffer.from(response.data, 'utf-8')
        const file = new MessageAttachment(buffer)

        const components = ProfileUtil.getComponents(
          profilePage,
          subProfilePage,
          'me',
          characterId,
        )

        await interaction.editReply({
          content: `${character.name}🌸${character.server.world}`,
          files: [file],
          embeds: [],
          attachments: [],
          components: components,
        })
      } else {
        const profileImage = await ProfileUtil.getImage(
          interaction,
          character,
          true,
          profilePage,
          subProfilePage,
        )
        if (!profileImage) throw new Error('profileImage is undefined')

        const file = new MessageAttachment(profileImage)

        const components = ProfileUtil.getComponents(
          profilePage,
          subProfilePage,
          'me',
          characterId,
        )

        await interaction.editReply({
          content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
          files: [file],
          embeds: [],
          attachments: [],
          components: components,
        })
      }
    }
  },
}
