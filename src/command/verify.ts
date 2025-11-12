import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { PurgeUserDataService } from "../service/PurgeUserDataService.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import * as log from "@std/log";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Manage the verification of your character.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
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
        .setName("remove")
        .setDescription(
          "Unlink your character and delete all stored data of you.",
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (interaction.options.getSubcommand() === "add") {
      const name = StringManipulationService.formatName(
        interaction.options.getString("name")!,
      );
      const server = interaction.options.getString("server")!.toLowerCase();
      const userId = interaction.user.id;

      if (!FfxivServerValidationService.isValidServer(server)) {
        await interaction.editReply("This server does not exist");
        return;
      }

      const characterIds = await NaagostoneApiService.fetchCharacterIdsByName(
        name,
        server,
      );

      if (characterIds.length > 1) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`,
        );
        await interaction.editReply({ embeds: [embed] });
      } else if (characterIds.length < 1) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `No characters were found for \`${name}\` on \`${server}\``,
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const characterId = characterIds[0];
        const character = await NaagostoneApiService.fetchCharacterById(
          characterId,
        );

        if (!character) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `:x: Character could not be retrieved.\nPlease try again later.`,
          );
          await interaction.editReply({ embeds: [embed] });
        } else {
          const verification = await VerificationsRepository.find(userId);

          if (verification) {
            let verificationCode = verification.verificationCode;

            if (verification.isVerified) {
              const verifiedCharacter = await NaagostoneApiService
                .fetchCharacterById(
                  verification.characterId,
                );

              if (!verifiedCharacter) {
                await interaction.editReply({
                  embeds: [
                    DiscordEmbedService.getSuccessEmbed(
                      `Could not fetch character. Please try again later.`,
                    ),
                  ],
                });
                return;
              }

              if (character.id === verifiedCharacter?.id) {
                await interaction.editReply({
                  embeds: [
                    DiscordEmbedService.getSuccessEmbed(
                      `You already verified this character.`,
                    ),
                  ],
                });
                return;
              }

              verificationCode = StringManipulationService
                .generateVerificationCode();

              try {
                await VerificationsRepository.setVerificationCode(
                  userId,
                  characterId,
                  verificationCode,
                );
              } catch (_error: unknown) {
                const embed = DiscordEmbedService.getErrorEmbed(
                  "An error occured during verification process. Please try again later.",
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
                  `Hey ${name}!\n\nYou are already verified with ${verifiedCharacter.name}! If you want to change your character, follow the instructions below.\n\nPlease add this verification code to your lodestone bio:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
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
                  `Hey ${name}!\n\nPlease add this verification code to your lodestone bio:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
                components: [row],
              });
            }
          } else {
            const verificationCode = StringManipulationService
              .generateVerificationCode();

            try {
              await VerificationsRepository
                .setVerificationCode(
                  userId,
                  characterId,
                  verificationCode,
                );
            } catch (_error: unknown) {
              const embed = DiscordEmbedService.getErrorEmbed(
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
                `Hey ${name}!\n\nPlease add this verification code to your lodestone bio:\n\`${verificationCode}\`\n\nAfter changing your bio, click on \`Verify me\`.`,
              components: [row],
            });
          }
        }
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      const userId = interaction.user.id;
      const verification = await VerificationsRepository.find(userId);

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
        const embed = DiscordEmbedService.getErrorEmbed(
          "Please verify your character first. See `/verify add`.",
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
        const embed = DiscordEmbedService.getSuccessEmbed("Cancelled.");
        await interaction.editReply({
          content: " ",
          embeds: [embed],
          components: [],
        });
        return;
      }

      let embed;
      try {
        await PurgeUserDataService.purgeUser(userId, parseInt(characterId));
        embed = DiscordEmbedService.getSuccessEmbed(
          "Your character was unlinked and all your data has been erased.",
        );
      } catch (_error: unknown) {
        embed = DiscordEmbedService.getErrorEmbed(
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
      const characterId = parseInt(buttonIdSplit[2]);

      const verification = await VerificationsRepository.find(userId);

      if (verification) {
        if (
          verification.characterId === characterId &&
          verification.isVerified
        ) {
          await interaction.editReply({
            embeds: [
              DiscordEmbedService.getSuccessEmbed(
                `You already verified this character.`,
              ),
            ],
          });
          return;
        }
      }

      const character = await NaagostoneApiService.fetchCharacterById(
        characterId,
      );

      if (!character) {
        await interaction.editReply({
          embeds: [
            DiscordEmbedService.getErrorEmbed(
              `Could not fetch your character.\nPlease try again later.`,
            ),
          ],
        });
      } else {
        const charBio = character.bio?.html;
        if (charBio.includes(verificationCode)) {
          try {
            if (verification) {
              ThemeRepository.get(verification.characterId)
                .then((theme) =>
                  ThemeRepository.set(userId, characterId, theme)
                )
                .catch((error) =>
                  log.error("Failed to update theme after verification", error)
                );
            }

            await VerificationsRepository.setVerification(
              userId,
              characterId,
            );
          } catch (_error: unknown) {
            const embed = DiscordEmbedService.getErrorEmbed(
              `Character could not be verified. Please try again later.`,
            );

            await interaction.editReply({
              embeds: [embed],
            });

            return;
          }

          const embed = DiscordEmbedService.getSuccessEmbed(
            `Congratulations, ${character.name}! You are now verified.\nYou no longer have to keep the verification code in your bio.`,
          );

          await interaction.editReply({
            content: "",
            embeds: [embed],
            components: [],
          });
        } else {
          await interaction.editReply({
            embeds: [
              DiscordEmbedService.getErrorEmbed(
                `Your lodestone bio does not match your verification code.\nVerification code: \`${verificationCode}\`\nYour current bio: \`${charBio}\``,
              ),
            ],
          });
        }
      }
    }
  },
};
