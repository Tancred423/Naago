const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageAttachment } = require('discord.js')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')
const ProfileUtil = require('../naagoLib/ProfileUtil')
const FfxivUtil = require('../naagoLib/FfxivUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('find')
    .setDescription("Find someone's FFXIV profile.")
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('A full character name')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('server')
        .setDescription('The server the character is on')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply()

    const userId = interaction.user.id
    const name = FfxivUtil.formatName(interaction.options.getString('name'))
    const server = interaction.options.getString('server').toLowerCase()

    // Check server name
    if (!FfxivUtil.isValidServer(server)) {
      const embed = DiscordUtil.getErrorEmbed(`This server doesn't exist.`)
      await interaction.editReply({
        embeds: [embed]
      })
      return
    }

    // Get character
    let characterIds
    try {
      characterIds = await FfxivUtil.getCharacterIdsByName(name, server)
    } catch (error) {
      console.log('yep hier')
      return
    }

    if (characterIds.length > 1) {
      const embed = DiscordUtil.getErrorEmbed(
        `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`
      )
      await interaction.editReply({
        embeds: [embed]
      })
    } else if (characterIds.length < 1) {
      const embed = DiscordUtil.getErrorEmbed(
        `No characters were found for \`${name}\` on \`${server}\``
      )
      await interaction.editReply({
        embeds: [embed]
      })
    } else {
      const characterId = characterIds[0]
      const character = await DbUtil.fetchCharacter(null, characterId)

      if (!character) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`
        )
        await interaction.editReply({
          embeds: [embed]
        })
      } else {
        try {
          const profileImage = await ProfileUtil.getImage(
            interaction,
            character,
            true,
            'profile'
          )
          if (!profileImage)
            throw new Error('[/find] profileImage is undefined')

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
    }
  }
}
