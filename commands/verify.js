const { SlashCommandBuilder } = require('@discordjs/builders')
const mysql = require('../naagoLib/mysql')
const { MessageActionRow, MessageButton } = require('discord.js')
const FfxivUtil = require('../naagoLib/FfxivUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const DbUtil = require('../naagoLib/DbUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your character.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Your character name')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('server')
        .setDescription('The server your character is on')
        .setRequired(true)
    ),
  async execute(interaction) {
    // API request will take a while, so defer the interaction
    await interaction.deferReply({ ephemeral: true })

    // Get options from interaction
    const name = FfxivUtil.formatName(interaction.options.getString('name'))
    const server = interaction.options.getString('server').toLowerCase()
    const userId = interaction.user.id

    // Check server validity
    if (!FfxivUtil.isValidServer(server)) {
      await interaction.editReply('This server does not exist')
      return
    }

    // Send authorization message
    const characterIds = await FfxivUtil.getCharacterIdsByName(name, server)

    if (characterIds.length > 1) {
      await interaction.editReply(
        DiscordUtil.getErrorEmbed(
          `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`
        )
      )
    } else if (characterIds.length < 1) {
      await interaction.editReply(
        DiscordUtil.getErrorEmbed(
          `No characters were found for \`${name}\` on \`${server}\``
        )
      )
    } else {
      const characterId = characterIds[0]
      const character = await FfxivUtil.getCharacterById(characterId)

      if (!character) {
        const embed = DiscordUtil.getErrorEmbed(
          `:x: Character could not be retrieved.\nPlease try again later.`
        )
        await interaction.editReply({ embeds: [embed] })
      } else {
        const verification = await DbUtil.getCharacterVerification(userId)

        if (verification) {
          let verificationCode = verification.verification_code

          if (verification.is_verified) {
            const verifiedCharacter = await FfxivUtil.getCharacterById(
              verification.character_id
            )

            if (character.id === verifiedCharacter.character_id) {
              await interaction.editReply({
                embeds: [
                  DiscordUtil.getSuccessEmbed(
                    `You already verified this character.`
                  )
                ]
              })
              return
            }

            // User is already verified and needs a new code for a new character
            verificationCode = await FfxivUtil.generateVerificationCode()

            await DbUtil.setVerificationCode(
              userId,
              characterId,
              verificationCode
            )

            const row = new MessageActionRow().addComponents(
              new MessageButton()
                .setCustomId(`verify.${verificationCode}.${characterId}`)
                .setLabel('Verify me')
                .setStyle('PRIMARY'),
              new MessageButton()
                .setLabel(`Lodestone: ${character.name}`)
                .setURL(
                  `https://eu.finalfantasyxiv.com/lodestone/character/${characterId}/`
                )
                .setStyle('LINK')
            )

            await interaction.editReply({
              content: `Hey ${name}!\n\nYou are already verified with \`${verifiedCharacter.name}\`! If you want to change your character, follow the instructions below.\n\nPlease change your lodestone bio to this verification code:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
              components: [row]
            })
          } else {
            const row = new MessageActionRow().addComponents(
              new MessageButton()
                .setCustomId(`verify.${verificationCode}.${characterId}`)
                .setLabel('Verify me')
                .setStyle('PRIMARY'),
              new MessageButton()
                .setLabel(`Lodestone: ${name}`)
                .setURL(
                  `https://eu.finalfantasyxiv.com/lodestone/character/${characterId}/`
                )
                .setStyle('LINK')
            )

            await interaction.editReply({
              content: `Hey ${name}!\n\nPlease change your lodestone bio to this verification code:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
              components: [row]
            })
          }
        } else {
          // User doesn't have verification code, now generate
          const verificationCode = FfxivUtil.generateVerificationCode()

          await DbUtil.setVerificationCode(
            userId,
            characterId,
            verificationCode
          )

          const row = new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId(`verify.${verificationCode}.${characterId}`)
              .setLabel('Verify me')
              .setStyle('PRIMARY'),
            new MessageButton()
              .setLabel(`Lodestone: ${character.name}`)
              .setURL(
                `https://eu.finalfantasyxiv.com/lodestone/character/${characterId}/`
              )
              .setStyle('LINK')
          )

          await interaction.editReply({
            content: `Hey ${name}!\n\nPlease change your lodestone bio to this verification code:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
            components: [row]
          })
        }
      }
    }
  },

  verifyUser: async (interaction) => {
    const idSplit = interaction.component.customId.split('.')
    if (idSplit.length !== 3) {
      await interaction.editReply({
        embeds: [
          DiscordUtil.getErrorEmbed(
            `Could not fetch your character. Please try again later.`
          )
        ],
        ephemeral: true
      })
      return
    }

    const userId = interaction.user.id
    const verificationCode = idSplit[1]
    const characterId = idSplit[2]

    // Check if already verified
    const verification = await DbUtil.getCharacterVerification(userId)

    if (verification) {
      if (
        verification.character_id === characterId &&
        verification.is_verified
      ) {
        await interaction.editReply({
          embeds: [
            DiscordUtil.getSuccessEmbed(`You already verified this character.`)
          ]
        })
        return
      }
    }

    // Get bio
    const character = await FfxivUtil.getCharacterById(characterId)

    if (!character) {
      await interaction.editReply({
        embeds: [
          DiscordUtil.getErrorEmbed(
            `Could not fetch your character.\nPlease try again later.`
          )
        ]
      })
    } else {
      const charBio = character.bio
      if (verificationCode === charBio) {
        DbUtil.verifyCharacter(userId, characterId)

        await interaction.editReply({
          embeds: [
            DiscordUtil.getSuccessEmbed(
              `Congratulations, ${character.name}! You are now verified.\nYou no longer have to keep the verification code in your bio.`
            )
          ]
        })
      } else {
        await interaction.editReply({
          embeds: [
            DiscordUtil.getErrorEmbed(
              `Your lodestone bio does not match your verification code.\nVerification code: \`${verificationCode}\`\nYour current bio: \`${charBio}\``
            )
          ]
        })
      }
    }
  }
}
