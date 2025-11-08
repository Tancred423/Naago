import { SlashCommandBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import FfxivUtil from "../naagoLib/FfxivUtil.ts";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import DbUtil from "../naagoLib/DbUtil.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Manage the verification of your character.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Verify your character.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Your character name.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("The server your character is on.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription(
          "Unlink your character and delete all stored data of you.",
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.options.getSubcommand() === "set") {
      const name = FfxivUtil.formatName(interaction.options.getString("name")!);
      const server = interaction.options.getString("server")!.toLowerCase();
      const userId = interaction.user.id;

      if (!FfxivUtil.isValidServer(server)) {
        await interaction.editReply("This server does not exist");
        return;
      }

      const characterIds = await FfxivUtil.getCharacterIdsByName(name, server);

      if (characterIds.length > 1) {
        const embed = DiscordUtil.getErrorEmbed(
          `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`,
        );
        await interaction.editReply({ embeds: [embed] });
      } else if (characterIds.length < 1) {
        const embed = DiscordUtil.getErrorEmbed(
          `No characters were found for \`${name}\` on \`${server}\``,
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const characterId = characterIds[0];
        const character = await FfxivUtil.getCharacterById(characterId);

        if (!character) {
          const embed = DiscordUtil.getErrorEmbed(
            `:x: Character could not be retrieved.\nPlease try again later.`,
          );
          await interaction.editReply({ embeds: [embed] });
        } else {
          const verification = await DbUtil.getCharacterVerification(userId);

          if (verification) {
            let verificationCode = verification.verificationCode;

            if (verification.isVerified) {
              const verifiedCharacter = await FfxivUtil.getCharacterById(
                verification.characterId,
              );

              if (character.ID === verifiedCharacter.ID) {
                await interaction.editReply({
                  embeds: [
                    DiscordUtil.getSuccessEmbed(
                      `You already verified this character.`,
                    ),
                  ],
                });
                return;
              }

              verificationCode = await FfxivUtil.generateVerificationCode();

              const successful = await DbUtil.setVerificationCode(
                userId,
                characterId,
                verificationCode,
              );

              if (!successful) {
                const embed = DiscordUtil.getErrorEmbed(
                  "An error occured during verification process. Please contact Tancred#0001 for help.",
                );

                await interaction.editReply({
                  content: "",
                  embeds: [embed],
                  components: [],
                });

                return;
              }

              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`verify.${verificationCode}.${characterId}`)
                  .setLabel("Verify me")
                  .setStyle(1),
                new ButtonBuilder()
                  .setLabel(`Lodestone: ${character.name}`)
                  .setURL(
                    `https://eu.finalfantasyxiv.com/lodestone/character/${characterId}/`,
                  )
                  .setStyle(5),
              );

              await interaction.editReply({
                content:
                  `Hey ${name}!\n\nYou are already verified with \`${verifiedCharacter.name}\`! If you want to change your character, follow the instructions below.\n\nPlease change your lodestone bio to this verification code:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
                components: [row],
              });
            } else {
              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`verify.${verificationCode}.${characterId}`)
                  .setLabel("Verify me")
                  .setStyle(1),
                new ButtonBuilder()
                  .setLabel(`Lodestone: ${name}`)
                  .setURL(
                    `https://eu.finalfantasyxiv.com/lodestone/character/${characterId}/`,
                  )
                  .setStyle(5),
              );

              await interaction.editReply({
                content:
                  `Hey ${name}!\n\nPlease change your lodestone bio to this verification code:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
                components: [row],
              });
            }
          } else {
            const verificationCode = FfxivUtil.generateVerificationCode();

            const successful = await DbUtil.setVerificationCode(
              userId,
              characterId,
              verificationCode,
            );

            if (!successful) {
              const embed = DiscordUtil.getErrorEmbed(
                "An error occured during verification process. Please contact Tancred#0001 for help.",
              );

              await interaction.editReply({
                content: "",
                embeds: [embed],
                components: [],
              });

              return;
            }

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`verify.${verificationCode}.${characterId}`)
                .setLabel("Verify me")
                .setStyle(1),
              new ButtonBuilder()
                .setLabel(`Lodestone: ${character.name}`)
                .setURL(
                  `https://eu.finalfantasyxiv.com/lodestone/character/${characterId}/`,
                )
                .setStyle(5),
            );

            await interaction.editReply({
              content:
                `Hey ${name}!\n\nPlease change your lodestone bio to this verification code:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
              components: [row],
            });
          }
        }
      }
    } else {
      const userId = interaction.user.id;
      const verification = await DbUtil.getCharacterVerification(userId);

      if (verification) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("verify.unset.cancel")
            .setLabel("No, cancel.")
            .setStyle(2),
          new ButtonBuilder()
            .setCustomId(`verify.unset.${verification.characterId}`)
            .setLabel("Yes, delete it.")
            .setStyle(4),
        );

        await interaction.editReply({
          content:
            "Are you sure you want to unlink your character and delete all stored data of you?",
          components: [row],
        });
      } else {
        const embed = DiscordUtil.getErrorEmbed(
          "Please verify your character first. See `/verify set`.",
        );
        await interaction.editReply({ embeds: [embed] });
      }
    }
  },

  async update(interaction: ButtonInteraction, buttonIdSplit: string[]) {
    if (buttonIdSplit.length !== 3) {
      throw new Error("[verify - button] button id length is !== 3");
    }

    const action = buttonIdSplit[1];
    const userId = interaction.user.id;

    if (action === "unset") {
      const characterId = buttonIdSplit[2];

      if (characterId === "cancel") {
        const embed = DiscordUtil.getSuccessEmbed("Cancelled.");
        await interaction.editReply({
          content: " ",
          embeds: [embed],
          components: [],
        });
        return;
      }

      const successful = await DbUtil.purgeUser(userId, characterId);
      let embed;
      if (successful) {
        embed = DiscordUtil.getSuccessEmbed(
          "Your character was unlinked and all your data has been erased.",
        );
      } else {
        embed = DiscordUtil.getErrorEmbed(
          "Your data could not be (fully) deleted. Please contact Tancred#0001 for help.",
        );
      }

      await interaction.editReply({
        content: " ",
        embeds: [embed],
        components: [],
      });
    } else {
      const verificationCode = action;
      const characterId = buttonIdSplit[2];

      const verification = await DbUtil.getCharacterVerification(userId);

      if (verification) {
        if (
          verification.characterId === characterId &&
          verification.isVerified
        ) {
          await interaction.editReply({
            embeds: [
              DiscordUtil.getSuccessEmbed(
                `You already verified this character.`,
              ),
            ],
          });
          return;
        }
      }

      const character = await FfxivUtil.getCharacterById(characterId);

      if (!character) {
        await interaction.editReply({
          embeds: [
            DiscordUtil.getErrorEmbed(
              `Could not fetch your character.\nPlease try again later.`,
            ),
          ],
        });
      } else {
        const charBio = character.bio?.html;
        if (charBio.includes(verificationCode)) {
          const successful = await DbUtil.verifyCharacter(userId, characterId);

          if (!successful) {
            const embed = DiscordUtil.getErrorEmbed(
              `Character could not be verified. Please contact Tancred#0001 for help.`,
            );

            await interaction.editReply({
              embeds: [embed],
            });

            return;
          }

          const embed = DiscordUtil.getSuccessEmbed(
            `Congratulations, ${character.name}! You are now verified.\nYou no longer have to keep the verification code in your bio.`,
          );

          await interaction.editReply({
            embeds: [embed],
          });
        } else {
          await interaction.editReply({
            embeds: [
              DiscordUtil.getErrorEmbed(
                `Your lodestone bio does not match your verification code.\nVerification code: \`${verificationCode}\`\nYour current bio: \`${charBio}\``,
              ),
            ],
          });
        }
      }
    }
  },
};
