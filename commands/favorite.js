const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageActionRow, MessageSelectMenu } = require('discord.js')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const FfxivUtil = require('../naagoLib/FfxivUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('favorite')
    .setDescription('Mark up to 25 characters as favorites.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a character to your favorites.')
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
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a character from your favorites.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription("Get your favorite's FFXIV profile.")
    ),
  async execute(interaction) {
    const userId = interaction.user.id
    const verification = await DbUtil.getCharacterVerification(userId)

    if (verification.is_verified) {
      if (interaction.options.getSubcommand() === 'add') {
        await interaction.deferReply({ ephemeral: true })

        const name = FfxivUtil.formatName(interaction.options.getString('name'))
        const server = interaction.options.getString('server').toLowerCase()

        // Check server name
        if (!FfxivUtil.isValidServer(server)) {
          const embed = DiscordUtil.getErrorEmbed(`This server doesn't exist.`)
          await interaction.deleteReply()
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true
          })
          return
        }

        // Get character
        let characterIds
        try {
          characterIds = await FfxivUtil.getCharacterIdsByName(name, server)
        } catch (error) {
          return
        }

        if (characterIds.length > 1) {
          const embed = DiscordUtil.getErrorEmbed(
            `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`
          )
          await interaction.deleteReply()
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true
          })
        } else if (characterIds.length < 1) {
          const embed = DiscordUtil.getErrorEmbed(
            `No characters were found for \`${name}\` on \`${server}\``
          )
          await interaction.deleteReply()
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true
          })
        } else {
          const characterId = characterIds[0]
          const character = await DbUtil.fetchCharacter(
            interaction,
            characterId
          )

          if (!character) {
            const embed = DiscordUtil.getErrorEmbed(
              `Could not fetch the character.\nPlease try again later.`
            )
            await interaction.deleteReply()
            await interaction.followUp({
              embeds: [embed],
              ephemeral: true
            })
          } else {
            const successful = await DbUtil.addFavorite(
              userId,
              characterId,
              character.name,
              `${character.server.world} (${character.server.dc})`
            )

            if (successful) {
              await interaction.editReply({
                content: ' ',
                components: [],
                embeds: [
                  DiscordUtil.getSuccessEmbed(
                    `\`${name}\` was added as favorite.`
                  )
                ],
                ephemeral: true
              })
            } else {
              await interaction.editReply({
                content: ' ',
                components: [],
                embeds: [
                  DiscordUtil.getErrorEmbed(
                    `\`${name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\``
                  )
                ],
                ephemeral: true
              })
            }
          }
        }
      } else if (interaction.options.getSubcommand() === 'remove') {
        await interaction.deferReply({ ephemeral: true })

        const favorites = await DbUtil.getFavorites(userId)

        if (favorites?.length === 0) {
          const embed = DiscordUtil.getErrorEmbed(
            `Please add favorites first. See \`/favorites add\``
          )
          await interaction.editReply({
            embeds: [embed]
          })
          return
        }

        const options = []
        for (const favorite of favorites) {
          options.push({
            label: favorite.character_name,
            description: favorite.server,
            value: favorite.character_id
          })
        }

        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('favorite.remove')
            .setPlaceholder('Select a character...')
            .addOptions(options)
        )

        await interaction.editReply({
          content: 'Which character would you like to remove?',
          components: [row]
        })
      } else {
        await interaction.deferReply()

        const favorites = await DbUtil.getFavorites(userId)

        if (favorites?.length === 0) {
          const embed = DiscordUtil.getErrorEmbed(
            `Please add favorites first. See \`/favorites add\``
          )
          await interaction.deleteReply()
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true
          })
          return
        }

        const options = []
        for (const favorite of favorites) {
          options.push({
            label: favorite.character_name,
            description: favorite.server,
            value: favorite.character_id
          })
        }

        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('favorite.get')
            .setPlaceholder('Select a character...')
            .addOptions(options)
        )

        await interaction.editReply({
          content: 'Whose FFXIV profile would you like to see?',
          components: [row]
        })
      }
    } else {
      const embed = DiscordUtil.getErrorEmbed(
        'Please verify your character first. See `/verify set`.'
      )
      await interaction.reply({ ephemeral: true, embeds: [embed] })
    }
  },

  async unfavoriteUser(interaction) {
    const idSplit = interaction.component.customId.split('.')

    if (idSplit.length === 2 && idSplit[1] === 'cancel') {
      const embed = DiscordUtil.getSuccessEmbed('Cancelled.')
      await interaction.editReply({
        content: ' ',
        components: [],
        embeds: [embed]
      })
      return
    }

    if (idSplit.length !== 3) {
      const embed = DiscordUtil.getErrorEmbed(
        `Could not fetch your character. Please try again later.`
      )
      await interaction.editReply({
        content: ' ',
        components: [],
        embeds: [embed]
      })
      return
    }

    const userId = interaction.user.id
    const characterId = idSplit[1]
    const characterName = idSplit[2]

    await DbUtil.removeFavorite(userId, characterId)

    const embed = DiscordUtil.getSuccessEmbed(
      `\`${characterName}\` has been removed from your favorites.`
    )
    await interaction.editReply({
      content: ' ',
      components: [],
      embeds: [embed]
    })
  }
}
