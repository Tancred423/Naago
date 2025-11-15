import {
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { Command } from "./type/Command.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";
import * as log from "@std/log";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { MaximumAmountReachedError } from "../database/error/MaximumAmountReachedError.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";

class FavoriteCommand extends Command {
  public readonly data = new SlashCommandBuilder()
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
    );

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed("Please verify your character first. See `/verify add`.");
      await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed] });
      return;
    }

    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "add":
        this.handleAdd(interaction, userId);
        break;
      case "remove":
        this.handleRemove(interaction, userId);
        break;
      default:
        throw new InvalidSubCommandError(`/favorite ${subCommand}`);
    }
  }

  private async handleAdd(interaction: ChatInputCommandInteraction, userId: string) {
    const targetName = StringManipulationService.formatName(interaction.options.getString("name")!);
    const targetServer = interaction.options.getString("server")!.toLowerCase();

    if (!FfxivServerValidationService.isValidServer(targetServer)) {
      const embed = DiscordEmbedService.getErrorEmbed(`The given server \`${targetServer}\` doesn't exist.`);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const characterIds = await NaagostoneApiService.fetchCharacterIdsByName(targetName, targetServer);

    if (characterIds.length > 1) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Multiple characters were found for \`${targetName}\` on \`${targetServer}\`.` +
          "\nPlease provide the command with the full name of your character to get rid of duplicates.",
      );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (characterIds.length < 1) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `No characters were found for \`${targetName}\` on \`${targetServer}\`.`,
      );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const characterId = characterIds[0];
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch the character.\nPlease try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const character = characterDataDto.character;

    try {
      await FavoritesRepository.add(
        userId,
        characterId,
        character.name,
        `${character.server.world} (${character.server.dc})`,
      );
      await DiscordMessageService.editReplySuccess(interaction, `\`${targetName}\` has been added to your favorites.`);
    } catch (error: unknown) {
      if (error instanceof MaximumAmountReachedError) {
        await DiscordMessageService.editReplyError(
          interaction,
          `\`${targetName}\` was NOT added as favorite as you already reached the maximum of 25.` +
            "\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.",
        );
        return;
      }

      await DiscordMessageService.editReplyError(
        interaction,
        `An unknown error prevented \`${targetName}\` to be added as favorite. Please try again later.`,
      );

      log.error(`Error while adding favorite: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  private async handleRemove(interaction: ChatInputCommandInteraction, userId: string) {
    const favorites = await FavoritesRepository.get(userId);

    if (favorites?.length === 0) {
      const embed = DiscordEmbedService.getErrorEmbed(`Please add favorites first. See \`/favorite add\``);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("favorite_character_remove")
      .setPlaceholder("Select a character...")
      .addOptions(options);

    const row = new LabelBuilder()
      .setLabel("Which character do you want to remove?")
      .setStringSelectMenuComponent(selectMenu);

    const modal = new ModalBuilder()
      .setCustomId("favorite.remove.modal")
      .setTitle("Remove Favorite")
      .addLabelComponents(row);

    await interaction.showModal(modal);
  }
}

export default new FavoriteCommand();
