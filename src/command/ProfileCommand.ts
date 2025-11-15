import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { Buffer } from "node:buffer";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { CharacterDataRepository } from "../database/repository/CharacterDataRepository.ts";
import { Character } from "../naagostone/type/CharacterTypes.ts";
import { ProfilePagesRepository } from "../database/repository/ProfilePagesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { Command } from "./type/Command.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";

class ProfileCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View character profiles.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("me")
        .setDescription("Your verified character's profile.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("find")
        .setDescription("View anyone's character profile.")
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
        .setName("favorite")
        .setDescription("Get a favorite character's profile.")
    );

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "me":
        await this.handleMe(interaction);
        break;
      case "find":
        await this.handleFind(interaction);
        break;
      case "favorite":
        await this.handleFavorite(interaction);
        break;
      default:
        throw new InvalidSubCommandError(`/profile ${subCommand}`);
    }
  }

  private async handleMe(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed("Please verify your character first. See `/verify add`.");
      await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed] });
      return;
    }

    await interaction.deferReply();

    const characterId = verification.characterId;
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch your character.\nPlease try again later.`);
      await interaction.deleteReply();
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }
    const character = characterDataDto.character;

    const profilePages = await ProfilePagesRepository.find(userId);
    const profilePage = (profilePages?.profilePage ?? "profile") as
      | "profile"
      | "classesjobs"
      | "equipment"
      | "attributes"
      | "portrait";
    const subProfilePage = profilePages?.subProfilePage as
      | "dowdom"
      | "dohdol"
      | null;

    if (!profilePage) {
      throw new Error("[/profile me] profilePage is undefined");
    }

    if (profilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);
      const components = ProfileGeneratorService.getComponents(profilePage, subProfilePage, "profile", characterId);

      await interaction.editReply({
        content: `${character.name}🌸${character.server.world}`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    } else {
      const profileImage = await ProfileGeneratorService.getImage(character, true, profilePage, subProfilePage);
      if (!profileImage) {
        throw new Error("[/profile me] profileImage is undefined");
      }

      const file = new AttachmentBuilder(profileImage);
      const components = ProfileGeneratorService.getComponents(profilePage, subProfilePage, "profile", characterId);

      await interaction.editReply({
        content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    }
  }

  private async handleFind(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = StringManipulationService.formatName(interaction.options.getString("name")!);
    const server = interaction.options.getString("server")!.toLowerCase();

    if (!FfxivServerValidationService.isValidServer(server)) {
      const embed = DiscordEmbedService.getErrorEmbed(`This server doesn't exist.`);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    const characterIds = await NaagostoneApiService.fetchCharacterIdsByName(name, server);

    if (characterIds.length > 1) {
      await DiscordMessageService.deleteAndFollowUpEphemeralError(
        interaction,
        `Multiple characters were found for \`${name}\` on \`${server}\`.` +
          "\nPlease provide the command with the full name of your character to get rid of duplicates.",
      );
      return;
    }

    if (characterIds.length < 1) {
      await DiscordMessageService.deleteAndFollowUpEphemeralError(
        interaction,
        `No characters were found for \`${name}\` on \`${server}\``,
      );
      return;
    }

    const characterId = characterIds[0];
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);

    if (!characterDataDto) {
      await DiscordMessageService.deleteAndFollowUpEphemeralError(
        interaction,
        `Could not fetch your character.\nPlease try again later.`,
      );
      return;
    }

    const character = characterDataDto.character;
    const profileImage = await ProfileGeneratorService.getImage(character, false, "profile");

    if (!profileImage) {
      throw new Error("profileImage is undefined");
    }

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents("profile", null, "profile", characterId);

    await interaction.editReply({
      content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  }

  private async handleFavorite(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed("Please verify your character first. See `/verify add`.");
      await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed] });
      return;
    }

    const favorites = await FavoritesRepository.get(userId);

    if (favorites?.length === 0) {
      const embed = DiscordEmbedService.getErrorEmbed(`Please add favorites first. See \`/favorite add\``);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const options = [];
    for (const favorite of favorites) {
      const characterData = await CharacterDataRepository.find(favorite.characterId);
      if (!characterData) {
        continue;
      }
      const character = JSON.parse(characterData.jsonString) as Character;
      options.push({
        label: character.name,
        description: `${character.server.world} (${character.server.dc})`,
        value: favorite.characterId.toString(),
      });
    }

    if (options.length === 0) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Sorry, we couldn't fetch the character data of your favorites. Please try again later.",
      );
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("favorite_character_select")
      .setPlaceholder("Select a character...")
      .addOptions(options);

    const row = new LabelBuilder()
      .setLabel("Whose profile do you want to see?")
      .setStringSelectMenuComponent(selectMenu);

    const modal = new ModalBuilder()
      .setCustomId("profile.favorite.modal")
      .setTitle("Favorite")
      .addLabelComponents(row);

    await interaction.showModal(modal);
  }
}

export default new ProfileCommand();
