import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import type {
  ActionRow,
  APISelectMenuOption,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageActionRowComponent,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
} from "discord.js";
import DbUtil from "../naagoLib/DbUtil.ts";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import FfxivUtil from "../naagoLib/FfxivUtil.ts";
import ProfileUtil from "../naagoLib/ProfileUtil.ts";
import { FavoritesRepository } from "../db/repository/FavoritesRepository.ts";
import { MaximumAmountReachedError } from "../db/error/MaximumAmountReachedError.ts";
import { NotInDatabaseError } from "../db/error/NotInDatabaseError.ts";

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
    const verification = await DbUtil.getCharacterVerification(userId);

    if (verification?.isVerified) {
      if (interaction.options.getSubcommand() === "add") {
        await interaction.deferReply({ ephemeral: true });

        const name = FfxivUtil.formatName(
          interaction.options.getString("name")!,
        );
        const server = interaction.options.getString("server")!.toLowerCase();

        if (!FfxivUtil.isValidServer(server)) {
          const embed = DiscordUtil.getErrorEmbed(`This server doesn't exist.`);
          await interaction.deleteReply();
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }

        const characterIds = await FfxivUtil.getCharacterIdsByName(
          name,
          server,
        );

        if (characterIds.length > 1) {
          const embed = DiscordUtil.getErrorEmbed(
            `Multiple characters were found for \`${name}\` on \`${server}\`.\nPlease provide the command with the full name of your character to get rid of duplicates.`,
          );
          await interaction.editReply({
            embeds: [embed],
          });
        } else if (characterIds.length < 1) {
          const embed = DiscordUtil.getErrorEmbed(
            `No characters were found for \`${name}\` on \`${server}\``,
          );
          await interaction.editReply({
            embeds: [embed],
          });
        } else {
          const characterId = characterIds[0];
          const characterDataDto = await DbUtil.fetchCharacter(
            interaction,
            characterId,
          );
          const character = characterDataDto.characterData;

          if (!characterDataDto) {
            const embed = DiscordUtil.getErrorEmbed(
              `Could not fetch the character.\nPlease try again later.`,
            );
            await interaction.editReply({
              embeds: [embed],
            });
          } else {
            try {
              await FavoritesRepository.addFavorite(
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
            }
          }
        }
      } else if (interaction.options.getSubcommand() === "remove") {
        await interaction.deferReply({ ephemeral: true });

        const favorites = await FavoritesRepository.getFavorites(userId);

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
            value: favorite.characterId,
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

        const favorites = await FavoritesRepository.getFavorites(userId);

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
            value: favorite.characterId,
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
      const embed = DiscordUtil.getErrorEmbed(
        "Please verify your character first. See `/verify set`.",
      );
      await interaction.reply({ ephemeral: true, embeds: [embed] });
    }
  },

  async get(interaction: StringSelectMenuInteraction) {
    const characterId = interaction.values[0];
    const characterDataDto = await DbUtil.fetchCharacter(
      interaction,
      characterId,
    );
    const character = characterDataDto.characterData;

    if (!character) {
      const embed = DiscordUtil.getErrorEmbed(
        `Could not fetch your character.\nPlease try again later.`,
      );
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      const profileImage = await ProfileUtil.getImage(
        interaction,
        character,
        false,
        "profile",
      );
      if (!profileImage) {
        throw new Error("[/favorite] profileImage is undefined");
      }

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileUtil.getComponents(
        "profile",
        null,
        "find",
        parseInt(characterId),
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
    const characterId = interaction.values[0];
    const messageRow = interaction.message.components[0] as ActionRow<
      MessageActionRowComponent
    >;
    const selectMenu = messageRow.components[0] as StringSelectMenuComponent;
    const characterName =
      selectMenu.options?.find((option: APISelectMenuOption) =>
        option.value === characterId
      )?.label ?? characterId;

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
      const embed = DiscordUtil.getSuccessEmbed("Cancelled.");

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
    const characterId = buttonIdSplit[2];
    const characterName = buttonIdSplit[3];

    try {
      await FavoritesRepository.removeFavorite(userId, characterId);
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
  const embed = DiscordUtil.getSuccessEmbed(message);

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
  const embed = DiscordUtil.getErrorEmbed(message);

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
  const embed = DiscordUtil.getErrorEmbed(message);

  await interaction.deleteReply();
  await interaction.followUp({
    embeds: [embed],
    ephemeral: true,
  });
}
