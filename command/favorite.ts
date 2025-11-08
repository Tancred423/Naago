import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
} from "discord.js";
import {
  ActionRow,
  APISelectMenuOption,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageActionRowComponent,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
} from "discord.js";
import * as log from "@std/log";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { MaximumAmountReachedError } from "../database/error/MaximumAmountReachedError.ts";
import { NotInDatabaseError } from "../database/error/NotInDatabaseError.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("favorite")
    .setDescription("Save up to 25 characters as favorites.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a character to your favorites.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("A full character name.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("The server the character is on.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a character from your favorites.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get")
        .setDescription("Get your favorite's FFXIV profile.")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (verification?.isVerified) {
      if (interaction.options.getSubcommand() === "add") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const name = StringManipulationService.formatName(
          interaction.options.getString("name")!,
        );
        const server = interaction.options.getString("server")!.toLowerCase();

        if (!FfxivServerValidationService.isValidServer(server)) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `This server doesn't exist.`,
          );
          await interaction.deleteReply();
          await interaction.followUp({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
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
          await interaction.editReply({
            embeds: [embed],
          });
        } else if (characterIds.length < 1) {
          const embed = DiscordEmbedService.getErrorEmbed(
            `No characters were found for \`${name}\` on \`${server}\``,
          );
          await interaction.editReply({
            embeds: [embed],
          });
        } else {
          const characterId = characterIds[0];
          const characterDataDto = await FetchCharacterService
            .fetchCharacterCached(
              interaction,
              characterId,
            );

          if (!characterDataDto) {
            const embed = DiscordEmbedService.getErrorEmbed(
              `Could not fetch the character.\nPlease try again later.`,
            );
            await interaction.editReply({
              embeds: [embed],
            });
          } else {
            const character = characterDataDto.character;

            try {
              await FavoritesRepository.add(
                userId,
                characterId,
                character.name,
                `${character.server.world} (${character.server.dc})`,
              );
              await sendSuccess(
                interaction,
                `\`${name}\` was added as favorite.`,
              );
            } catch (error: unknown) {
              if (error instanceof MaximumAmountReachedError) {
                await sendError(
                  interaction,
                  `\`${name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.`,
                );
                return;
              }

              await sendError(
                interaction,
                `An unknown error prevented \`${name}\` to be added as favorite. Please try again later.`,
              );

              log.error("Error while adding favorite.", error);
            }
          }
        }
      } else if (interaction.options.getSubcommand() === "remove") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const favorites = await FavoritesRepository.get(userId);

        if (favorites?.length === 0) {
          await sendError(
            interaction,
            "Please add favorites first. See `/favorites add`",
          );
          return;
        }

        const options = [];
        for (const favorite of favorites) {
          options.push({
            label: favorite.characterName,
            description: favorite.server,
            value: favorite.characterId.toString(),
          });
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("favorite.remove")
              .setPlaceholder("Select a character...")
              .addOptions(options),
          );

        await interaction.editReply({
          content: "Which character would you like to remove?",
          components: [row],
        });
      } else {
        await interaction.deferReply();

        const favorites = await FavoritesRepository.get(userId);

        if (favorites?.length === 0) {
          await sendErrorFollowUp(
            interaction,
            `Please add favorites first. See \`/favorites add\``,
          );
          return;
        }

        const options = [];
        for (const favorite of favorites) {
          options.push({
            label: favorite.characterName,
            description: favorite.server,
            value: favorite.characterId.toString(),
          });
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("favorite.get")
              .setPlaceholder("Select a character...")
              .addOptions(options),
          );

        await interaction.editReply({
          content: "Whose FFXIV profile would you like to see?",
          components: [row],
        });
      }
    } else {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Please verify your character first. See `/verify set`.",
      );
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
    }
  },

  async get(interaction: StringSelectMenuInteraction) {
    const characterId = parseInt(interaction.values[0]);
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(
      interaction,
      characterId,
    );

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Could not fetch your character.\nPlease try again later.`,
      );
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const character = characterDataDto.character;

      const profileImage = await ProfileGeneratorService.getImage(
        interaction,
        character,
        false,
        "profile",
      );
      if (!profileImage) {
        throw new Error("[/favorite] profileImage is undefined");
      }

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileGeneratorService.getComponents(
        "profile",
        null,
        "find",
        characterId,
      );

      await interaction.editReply({
        content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    }
  },

  async remove(interaction: StringSelectMenuInteraction) {
    const characterId = parseInt(interaction.values[0]);
    const messageRow = interaction.message.components[0] as ActionRow<
      MessageActionRowComponent
    >;
    const selectMenu = messageRow.components[0] as StringSelectMenuComponent;
    const characterName =
      selectMenu.options?.find((option: APISelectMenuOption) =>
        option.value === characterId.toString()
      )?.label ?? characterId.toString();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("favorite.unset.cancel")
        .setLabel("No, cancel.")
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId(`favorite.unset.${characterId}.${characterName}`)
        .setLabel("Yes, remove them.")
        .setStyle(4),
    );

    await interaction.editReply({
      content:
        `Are you sure you want to remove \`${characterName}\` from your favorites?`,
      components: [row],
    });
  },

  async update(interaction: ButtonInteraction, buttonIdSplit: string[]) {
    if (buttonIdSplit.length === 3 && buttonIdSplit[2] === "cancel") {
      const embed = DiscordEmbedService.getSuccessEmbed("Cancelled.");

      await interaction.editReply({
        content: " ",
        components: [],
        embeds: [embed],
      });

      return;
    }

    if (buttonIdSplit.length !== 4) {
      throw new Error("[favorite.js#remove] button id length is !== 4");
    }

    const userId = interaction.user.id;
    const characterId = parseInt(buttonIdSplit[2]);
    const characterName = buttonIdSplit[3];

    try {
      await FavoritesRepository.delete(userId, characterId);
      await sendSuccess(
        interaction,
        `\`${characterName}\` has been removed from your favorites.`,
      );
    } catch (error: unknown) {
      if (error instanceof NotInDatabaseError) {
        await sendError(
          interaction,
          `${characterName} is not in your favorites.`,
        );
        return;
      }

      await sendError(
        interaction,
        `An unknown error prevented \`${characterName}\` from being removed from your favorites. Please try again later.`,
      );
    }
  },
};

async function sendSuccess(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getSuccessEmbed(message);

  await interaction.editReply({
    content: " ",
    components: [],
    embeds: [embed],
  });
}

async function sendError(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getErrorEmbed(message);

  await interaction.editReply({
    content: " ",
    components: [],
    embeds: [embed],
  });
}

async function sendErrorFollowUp(
  interaction: ChatInputCommandInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getErrorEmbed(message);

  await interaction.deleteReply();
  await interaction.followUp({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
