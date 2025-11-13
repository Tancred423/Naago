import { AttachmentBuilder, ButtonInteraction, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { ProfilePagesRepository } from "../database/repository/ProfilePagesRepository.ts";
import { Buffer } from "node:buffer";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { ProfilePageButton, SubProfilePageButton } from "./type/ProfilePageButtonTypes.ts";

export class ProfileCommandHandler {
  public static async handlePageSwapButton(interaction: ButtonInteraction, buttonIdSplit: string[]): Promise<void> {
    if (buttonIdSplit.length !== 3) {
      throw new Error("[/profile - button] button id length is !== 3");
    }

    const profilePage = buttonIdSplit[1] as ProfilePageButton;
    const characterId = parseInt(buttonIdSplit[2]);
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);
    const isMe = (verification?.isVerified ?? false) && verification?.characterId === characterId;
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch this character.\nPlease try again later.`);
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const character = characterDataDto.character;

    let subProfilePage: SubProfilePageButton | null = null;
    if (profilePage === "dowdom" || profilePage === "dohdol") {
      subProfilePage = profilePage;
    } else if (profilePage === "classesjobs" && !subProfilePage) {
      subProfilePage = "dowdom";
    }

    const actualProfilePage = profilePage === "dowdom" || profilePage === "dohdol" ? "classesjobs" : profilePage;

    if (isMe) {
      ProfilePagesRepository.set(userId, actualProfilePage, subProfilePage);
    }

    if (actualProfilePage === "portrait") {
      const response = await fetch(character.portrait);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new AttachmentBuilder(buffer);
      const components = ProfileGeneratorService.getComponents(
        actualProfilePage,
        subProfilePage,
        "profile",
        characterId,
      );

      await interaction.editReply({
        content: `${character.name}🌸${character.server.world}`,
        files: [file],
        embeds: [],
        attachments: [],
        components: components,
      });

      return;
    }

    const profileImage = await ProfileGeneratorService.getImage(character, isMe, actualProfilePage, subProfilePage);

    if (!profileImage) throw new Error("profileImage is undefined");

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents(actualProfilePage, subProfilePage, "profile", characterId);

    await interaction.editReply({
      content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  }

  public static async handleFavoriteModal(interaction: ModalSubmitInteraction): Promise<void> {
    const fields = interaction.fields;
    const stringSelectValue = fields.getStringSelectValues("favorite_character_select");

    if (stringSelectValue.length !== 1) {
      throw new Error(`Found \`${stringSelectValue.length}\` select values. Expected 1.`);
    }

    await interaction.deferReply();

    const characterId = parseInt(stringSelectValue[0]);
    const characterDataDto = await FetchCharacterService.fetchCharacterCached(interaction, characterId);

    if (!characterDataDto) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch your character.\nPlease try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const character = characterDataDto.character;
    const profileImage = await ProfileGeneratorService.getImage(character, false, "profile");

    if (!profileImage) {
      throw new Error("[/profile favorite] profileImage is undefined");
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
}
