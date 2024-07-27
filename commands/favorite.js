const { SlashCommandBuilder } = require('@discordjs/builders')
const {
  MessageActionRow,
  MessageSelectMenu,
  MessageButton,
  MessageAttachment,
} = require('discord.js')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const FfxivUtil = require('../naagoLib/FfxivUtil')
const ProfileUtil = require('../naagoLib/ProfileUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('favorite')
    .setDescription('Save up to 25 characters as favorites.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a character to your favorites.')
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a character from your favorites.'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription("Get your favorite's FFXIV profile."),
    ),
  async execute(interaction) {
    const userId = interaction.user.id
    const verification = await DbUtil.getCharacterVerification(userId)

    if (verification?.is_verified) {
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
          await interaction.editReply({
            embeds: [embed],
            ephemeral: true,
          })
        } else if (characterIds.length < 1) {
          const embed = DiscordUtil.getErrorEmbed(
            `No characters were found for \`${name}\` on \`${server}\``,
          )
          await interaction.editReply({
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
              `Could not fetch the character.\nPlease try again later.`,
            )
            await interaction.editReply({
              embeds: [embed],
              ephemeral: true,
            })
          } else {
            const successful = await DbUtil.addFavorite(
              userId,
              characterId,
              character.name,
              `${character.server.world} (${character.server.dc})`,
            )

            if (successful === 'capped') {
              const embed = DiscordUtil.getErrorEmbed(
                `\`${name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.`,
              )

              await interaction.editReply({
                content: ' ',
                components: [],
                embeds: [embed],
              })

              return
            }

            if (!successful) {
              const embed = DiscordUtil.getErrorEmbed(
                `\`${name}\` could not be added as favorite. Please contact Tancred#0001 for help.`,
              )

              await interaction.editReply({
                content: ' ',
                components: [],
                embeds: [embed],
              })

              return
            }

            if (successful) {
              const embed = DiscordUtil.getSuccessEmbed(
                `\`${name}\` was added as favorite.`,
              )

              await interaction.editReply({
                content: ' ',
                components: [],
                embeds: [embed],
              })
            }
          }
        }
      } else if (interaction.options.getSubcommand() === 'remove') {
        await interaction.deferReply({ ephemeral: true })

        const favorites = await DbUtil.getFavorites(userId)

        if (favorites?.length === 0) {
          const embed = DiscordUtil.getErrorEmbed(
            `Please add favorites first. See \`/favorites add\``,
          )
          await interaction.editReply({
            embeds: [embed],
          })
          return
        }

        const options = []
        for (const favorite of favorites) {
          options.push({
            label: favorite.character_name,
            description: favorite.server,
            value: favorite.character_id,
          })
        }

        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('favorite.remove')
            .setPlaceholder('Select a character...')
            .addOptions(options),
        )

        await interaction.editReply({
          content: 'Which character would you like to remove?',
          components: [row],
        })
      } else {
        await interaction.deferReply()

        const favorites = await DbUtil.getFavorites(userId)

        if (favorites?.length === 0) {
          const embed = DiscordUtil.getErrorEmbed(
            `Please add favorites first. See \`/favorites add\``,
          )
          await interaction.deleteReply()
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true,
          })
          return
        }

        const options = []
        for (const favorite of favorites) {
          options.push({
            label: favorite.character_name,
            description: favorite.server,
            value: favorite.character_id,
          })
        }

        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('favorite.get')
            .setPlaceholder('Select a character...')
            .addOptions(options),
        )

        await interaction.editReply({
          content: 'Whose FFXIV profile would you like to see?',
          components: [row],
        })
      }
    } else {
      const embed = DiscordUtil.getErrorEmbed(
        'Please verify your character first. See `/verify set`.',
      )
      await interaction.reply({ ephemeral: true, embeds: [embed] })
    }
  },

  async get(interaction) {
    const characterId = interaction.values[0]
    const characterDataDto = await DbUtil.fetchCharacter(
      interaction,
      characterId,
    )
    const character = characterDataDto.characterData

    if (!character) {
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
      if (!profileImage)
        throw new Error('[/favorite] profileImage is undefined')

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
  },

  async remove(interaction) {
    const characterId = interaction.values[0]
    const characterName =
      interaction.message.components[0].components[0].options.find(
        (o) => o.value === characterId,
      )?.label ?? characterId

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('favorite.unset.cancel')
        .setLabel('No, cancel.')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(`favorite.unset.${characterId}.${characterName}`)
        .setLabel('Yes, remove them.')
        .setStyle('DANGER'),
    )

    await interaction.editReply({
      content: `Are you sure you want to remove \`${characterName}\` from your favorites?`,
      components: [row],
    })
  },

  async confirmRemove(interaction, buttonIdSplit) {
    if (buttonIdSplit.length === 3 && buttonIdSplit[2] === 'cancel') {
      const embed = DiscordUtil.getSuccessEmbed('Cancelled.')

      await interaction.editReply({
        content: ' ',
        components: [],
        embeds: [embed],
      })

      return
    }

    if (buttonIdSplit.length !== 4)
      throw new Error('[favorite.js#remove] button id length is !== 4')

    const userId = interaction.user.id
    const characterId = buttonIdSplit[2]
    const characterName = buttonIdSplit[3]

    const successful = await DbUtil.removeFavorite(userId, characterId)

    if (!successful) {
      const embed = DiscordUtil.getErrorEmbed(
        `\`${characterName}\` could not be removed from your favorites. Please contact Tancred#0001 for help.`,
      )
      await interaction.editReply({
        content: ' ',
        components: [],
        embeds: [embed],
      })

      return
    }

    const embed = DiscordUtil.getSuccessEmbed(
      `\`${characterName}\` has been removed from your favorites.`,
    )
    await interaction.editReply({
      content: ' ',
      components: [],
      embeds: [embed],
    })
  },
}
