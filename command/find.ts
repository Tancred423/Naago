import { SlashCommandBuilder } from "@discordjs/builders";
import {
  AttachmentBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { FfxivServerValidationService } from "../service/FfxivServerValidationService.ts";
import { Buffer } from "node:buffer";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("find")
    .setDescription("Find someone's FFXIV profile.")
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
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

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
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } else if (characterIds.length < 1) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `No characters were found for \`${name}\` on \`${server}\``,
      );
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const characterId = characterIds[0];
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
          ephemeral: true,
        });
      } else {
        const character = characterDataDto.character;

        const profileImage = await ProfileGeneratorService.getImage(
          interaction,
          character,
          false,
          "profile",
        );
        if (!profileImage) throw new Error("[/find] profileImage is undefined");

        const file = new AttachmentBuilder(profileImage);

        const components = ProfileGeneratorService.getComponents(
          "profile",
          null,
          "find",
          characterId,
        );

        await interaction.editReply({
          content:
            `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
          files: [file],
          embeds: [],
          attachments: [],
          components: components,
        });
      }
    }
  },

  async update(interaction: ButtonInteraction, buttonIdSplit: string[]) {
    if (buttonIdSplit.length !== 3) {
      throw new Error("[/find - button] button id length is !== 3");
    }

    const characterId = parseInt(buttonIdSplit[2]);
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(
      interaction,
      characterId,
    );

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Could not fetch this character.\nPlease try again later.`,
      );
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const character = characterDataDto.character;

    let profilePage = buttonIdSplit[1] as
      | "profile"
      | "classesjobs"
      | "equipment"
      | "attributes"
      | "portrait"
      | "dowdom"
      | "dohdol";
    let subProfilePage: "dowdom" | "dohdol" | null = null;
    if (profilePage === "dowdom" || profilePage === "dohdol") {
      subProfilePage = profilePage;
      profilePage = "classesjobs";
    } else if (profilePage === "classesjobs" && !subProfilePage) {
      subProfilePage = "dowdom";
    }

    if (profilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);

      const components = ProfileGeneratorService.getComponents(
        profilePage,
        subProfilePage,
        "find",
        characterId,
      );

      await interaction.editReply({
        content: `${character.name}🌸${character.server.world}`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });
    } else {
      const profileImage = await ProfileGeneratorService.getImage(
        interaction,
        character,
        false,
        profilePage,
        subProfilePage,
      );
      if (!profileImage) throw new Error("profileImage is undefined");

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileGeneratorService.getComponents(
        profilePage,
        subProfilePage,
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
};
