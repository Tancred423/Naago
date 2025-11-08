import { SlashCommandBuilder } from "@discordjs/builders";
import {
  AttachmentBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import DbUtil from "../naagoLib/DbUtil.ts";
import ProfileUtil from "../naagoLib/ProfileUtil.ts";
import { Buffer } from "node:buffer";

export default {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("Your verified character's FFXIV profile."),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const verification = await DbUtil.getCharacterVerification(userId);

    if (!verification?.isVerified) {
      const embed = DiscordUtil.getErrorEmbed(
        "Please verify your character first. See `/verify set`.",
      );
      await interaction.reply({ ephemeral: true, embeds: [embed] });
      return;
    }

    await interaction.deferReply();

    const characterId = verification.characterId;
    const characterDataDto = await DbUtil.fetchCharacter(
      interaction,
      characterId,
    );
    const character = characterDataDto.characterData;

    if (!characterDataDto || !character) {
      const embed = DiscordUtil.getErrorEmbed(
        `Could not fetch your character.\nPlease try again later.`,
      );
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    const profilePages = await DbUtil.getProfilePages(userId);
    const profilePage = (profilePages.profilePage ?? "profile") as
      | "profile"
      | "classesjobs"
      | "equipment"
      | "attributes"
      | "portrait";
    const subProfilePage = profilePages.subProfilePage as
      | "dowdom"
      | "dohdol"
      | null;

    if (!profilePage) throw new Error("[/me] profilePage is undefined");

    if (profilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);

      const components = ProfileUtil.getComponents(
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
      const profileImage = await ProfileUtil.getImage(
        interaction,
        character,
        true,
        profilePage,
        subProfilePage,
      );
      if (!profileImage) throw new Error("[/me] profileImage is undefined");

      const file = new AttachmentBuilder(profileImage);

      const components = ProfileUtil.getComponents(
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
    const verification = await DbUtil.getCharacterVerification(userId);

    if (verification?.isVerified) {
      const characterId = verification.characterId;
      const characterDataDto = await DbUtil.fetchCharacterCached(
        interaction,
        characterId,
      );
      const character = characterDataDto.characterData;

      if (!characterDataDto) {
        const embed = DiscordUtil.getErrorEmbed(
          `Could not fetch your character.\nPlease try again later.`,
        );
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
        return;
      }

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

      DbUtil.updateProfilePage(userId, profilePage, subProfilePage);

      if (profilePage === "portrait") {
        const response = await fetch(character.portrait);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const file = new AttachmentBuilder(buffer);

        const components = ProfileUtil.getComponents(
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
        const profileImage = await ProfileUtil.getImage(
          interaction,
          character,
          true,
          profilePage,
          subProfilePage,
        );
        if (!profileImage) throw new Error("profileImage is undefined");

        const file = new AttachmentBuilder(profileImage);

        const components = ProfileUtil.getComponents(
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
