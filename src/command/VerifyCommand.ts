import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { Command } from "./type/Command.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";
import { Verification } from "../database/schema/verifications.ts";
import { Character } from "../naagostone/type/CharacterTypes.ts";
import * as log from "@std/log";

class VerifyCommand extends Command {
  public readonly data = new SlashCommandBuilder()
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
        .setDescription("Unlink your character and delete all stored data of you.")
    );

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "add":
        await this.handleAdd(interaction);
        break;
      case "remove":
        await this.handleRemove(interaction);
        break;
      default:
        throw new InvalidSubCommandError(`/verify ${subCommand}`);
    }
  }

  private async handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = StringManipulationService.formatName(interaction.options.getString("name")!);
    const server = interaction.options.getString("server")!.toLowerCase();
    const userId = interaction.user.id;

    if (!FfxivServerValidationService.isValidServer(server)) {
      await interaction.reply({ content: "This server does not exist" });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const characterIds = await NaagostoneApiService.fetchCharacterIdsByName(name, server);

    if (characterIds.length > 1) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Multiple characters were found for \`${name}\` on \`${server}\`.` +
          "\nPlease provide the command with the full name of your character to get rid of duplicates.",
      );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (characterIds.length < 1) {
      const embed = DiscordEmbedService.getErrorEmbed(`No characters were found for \`${name}\` on \`${server}\``);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const characterId = characterIds[0];
    const character = await NaagostoneApiService.fetchCharacterById(characterId);

    if (!character) {
      const embed = DiscordEmbedService.getErrorEmbed(`:x: Character could not be retrieved.\nPlease try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const verification = await VerificationsRepository.find(userId);

    verification && verification.isVerified
      ? await this.handleAddUpdate(interaction, userId, character, verification)
      : await this.handleAddNew(interaction, userId, character);
  }

  private async handleAddUpdate(
    interaction: ChatInputCommandInteraction,
    userId: string,
    character: Character,
    verification: Verification,
  ): Promise<void> {
    const verifiedCharacter = await NaagostoneApiService.fetchCharacterById(verification.characterId);

    if (!verifiedCharacter) {
      const embed = DiscordEmbedService.getSuccessEmbed(`Could not fetch character. Please try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (character.id === verifiedCharacter?.id) {
      const embed = DiscordEmbedService.getSuccessEmbed(`You already verified this character.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const verificationCode = StringManipulationService.generateVerificationCode();

    try {
      await VerificationsRepository.setVerificationCode(userId, character.id, verificationCode);
    } catch (error: unknown) {
      log.error(`Failed to set verification code: ${error instanceof Error ? error.stack : String(error)}`);
      const embed = DiscordEmbedService.getErrorEmbed(
        "An error occured during verification process. Please try again later.",
      );
      await interaction.editReply({ content: "", embeds: [embed], components: [] });
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify.${verificationCode}.${character.id}`)
        .setLabel("Verify me")
        .setStyle(1),
      new ButtonBuilder()
        .setLabel(`Lodestone: ${character.name}`)
        .setURL(`https://eu.finalfantasyxiv.com/lodestone/character/${character.id}/`)
        .setStyle(5),
    );

    await interaction.editReply({
      content: `Hey ${name}!` +
        `\n\nYou are already verified with ${verifiedCharacter.name}! If you want to change your character, follow the instructions below.` +
        "\n\nPlease add this verification code to your lodestone bio:" +
        `\n\`${verificationCode}\`` +
        "\n\nAfter changing your bio, click on `Verify me`.",
      components: [row],
    });
  }

  private async handleAddNew(
    interaction: ChatInputCommandInteraction,
    userId: string,
    character: Character,
  ): Promise<void> {
    const verificationCode = StringManipulationService.generateVerificationCode();

    try {
      await VerificationsRepository.setVerificationCode(userId, character.id, verificationCode);
    } catch (_error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "An error occured during verification process. Please try again later.",
      );
      await interaction.editReply({ content: "", embeds: [embed], components: [] });
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify.${verificationCode}.${character.id}`)
        .setLabel("Verify me")
        .setStyle(1),
      new ButtonBuilder()
        .setLabel(`Lodestone: ${character.name}`)
        .setURL(`https://eu.finalfantasyxiv.com/lodestone/character/${character.id}/`)
        .setStyle(5),
    );

    await interaction.editReply({
      content: `Hey ${name}!` +
        "\n\nPlease add this verification code to your lodestone bio:" +
        `\n\`${verificationCode}\`` +
        "\n\nAfter changing your bio, click on `Verify me`.",
      components: [row],
    });
  }

  private async handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification) {
      const embed = DiscordEmbedService.getErrorEmbed("Please verify your character first. See `/verify add`.");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
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
      content: "Are you sure you want to unlink your character and delete all stored data of you?",
      components: [row],
    });
  }
}

export default new VerifyCommand();
