const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const ProfileUtil = require('../naagoLib/ProfileUtil')
const FfxivUtil = require('../naagoLib/FfxivUtil')
const axios = require('axios')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('find')
    .setDescription("Find someone's FFXIV profile.")
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('A full character name.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('server')
        .setDescription('The server the character is on.')
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply()

    const name = FfxivUtil.formatName(interaction.options.getString('name'))
    const server = interaction.options.getString('server').toLowerCase()

    // Check server name
    if (!FfxivUtil.isValidServer(server)) {
      const embed = DiscordUtil.getErrorEmbed(`This server doesn't exist.`)
      await interaction.deleteReply()
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      })
      return
    }

    // Get character
    const characterIds = await FfxivUtil.getCharacterIdsByName(name, server)

    if (characterIds.length > 1) {
      const embed = DiscordUtil.getErrorEmbed(
        `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`,
      )
      await interaction.deleteReply()
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      })
    } else if (characterIds.length < 1) {
      const embed = DiscordUtil.getErrorEmbed(
        `No characters were found for \`${name}\` on \`${server}\``,
      )
      await interaction.deleteReply()
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      })
    } else {
      const characterId = characterIds[0]
      const characterDataDto = await DbUtil.fetchCharacter(
        interaction,
        characterId,
      )
      const character = characterDataDto.characterData

      if (!characterDataDto) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`,
        )
        await interaction.deleteReply()
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        })
      } else {
        const profileImage = await ProfileUtil.getImage(
          interaction,
          character,
          false,
          'profile',
        )
        if (!profileImage) throw new Error('[/find] profileImage is undefined')

        const file = new MessageAttachment(profileImage)

        const components = ProfileUtil.getComponents(
          'profile',
          null,
          'find',
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

  async update(interaction, buttonIdSplit) {
    // Get character
    if (buttonIdSplit.length !== 3)
      throw new Error('[/find - button] button id length is !== 3')

    const characterId = buttonIdSplit[2]
    const characterDataDto = await DbUtil.fetchCharacterCached(
      interaction,
      characterId,
    )
    const character = characterDataDto.characterData

    if (!characterDataDto) {
      const embed = DiscordUtil.getErrorEmbed(
        `Could not fetch this character.\nPlease try again later.`,
      )
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
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

    if (profilePage === 'portrait') {
      const response = await axios.get(character.portrait, {
        responseType: 'arraybuffer',
      })
      const buffer = Buffer.from(response.data, 'utf-8')
      const file = new MessageAttachment(buffer)

      const components = ProfileUtil.getComponents(
        profilePage,
        subProfilePage,
        'find',
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
        false,
        profilePage,
        subProfilePage,
      )
      if (!profileImage) throw new Error('profileImage is undefined')

      const file = new MessageAttachment(profileImage)

      const components = ProfileUtil.getComponents(
        profilePage,
        subProfilePage,
        'find',
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
}
