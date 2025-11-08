import { SlashCommandBuilder } from "@discordjs/builders";
import {
  AttachmentBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { Buffer } from "node:buffer";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { ProfilePagesRepository } from "../database/repository/ProfilePagesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("Your verified character's FFXIV profile."),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Please verify your character first. See `/verify set`.",
      );
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
      });
      return;
    }

    await interaction.deferReply();

    const characterId = verification.characterId;
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

    if (!profilePage) throw new Error("[/me] profilePage is undefined");

    if (profilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);

      const components = ProfileGeneratorService.getComponents(
        profilePage,
        subProfilePage,
        "me",
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
        true,
        profilePage,
        subProfilePage,
      );
      if (!profileImage) throw new Error("[/me] profileImage is undefined");

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileGeneratorService.getComponents(
        profilePage,
        subProfilePage,
        "me",
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

  async update(interaction: ButtonInteraction, buttonIdSplit: string[]) {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (verification?.isVerified) {
      const characterId = verification.characterId;
      const characterDataDto = await FetchCharacterService.fetchCharacterCached(
        interaction,
        characterId,
      );

      if (!characterDataDto) {
        const embed = DiscordEmbedService.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`,
        );
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const character = characterDataDto.character;

      if (buttonIdSplit.length !== 3) {
        throw new Error("[/me - button] button id length is !== 3");
      }

      let profilePage = buttonIdSplit[1] as
        | "profile"
        | "classesjobs"
        | "equipment"
        | "attributes"
        | "portrait"
        | "dowdom"
        | "dohdol"
        | "socialmedia";
      let subProfilePage: "dowdom" | "dohdol" | null = null;
      if (profilePage === "dowdom" || profilePage === "dohdol") {
        subProfilePage = profilePage;
        profilePage = "classesjobs";
      } else if (profilePage === "classesjobs" && !subProfilePage) {
        subProfilePage = "dowdom";
      } else if (profilePage === "socialmedia") {
        profilePage = "profile";
      }

      ProfilePagesRepository.set(userId, profilePage, subProfilePage);

      if (profilePage === "portrait") {
        const response = await fetch(character.portrait);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const file = new AttachmentBuilder(buffer);

        const components = ProfileGeneratorService.getComponents(
          profilePage,
          subProfilePage,
          "me",
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
          true,
          profilePage,
          subProfilePage,
        );
        if (!profileImage) throw new Error("profileImage is undefined");

        const file = new AttachmentBuilder(profileImage);

        const components = ProfileGeneratorService.getComponents(
          profilePage,
          subProfilePage,
          "me",
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
};
