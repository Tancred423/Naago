import { ButtonInteraction } from "discord.js";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { PurgeUserDataService } from "../service/PurgeUserDataService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import * as log from "@std/log";

export class VerifyCommandHelper {
  public static async update(
    interaction: ButtonInteraction,
    buttonIdSplit: string[],
  ): Promise<void> {
    if (buttonIdSplit.length !== 3) {
      throw new Error("button id length is !== 3");
    }

    const userId = interaction.user.id;

    if (buttonIdSplit[1] === "unset") {
      const characterId = buttonIdSplit[2];
      await this.handleUnset(interaction, userId, characterId);
      return;
    }

    const verificationCode = buttonIdSplit[1];
    const characterId = parseInt(buttonIdSplit[2]);
    await this.handleVerification(interaction, userId, verificationCode, characterId);
  }

  private static async handleUnset(interaction: ButtonInteraction, userId: string, characterId: string) {
    if (characterId === "cancel") {
      const embed = DiscordEmbedService.getSuccessEmbed("Cancelled.");
      await interaction.editReply({ content: " ", embeds: [embed], components: [] });
      return;
    }

    try {
      await PurgeUserDataService.purgeUser(userId, parseInt(characterId));
      const embed = DiscordEmbedService.getSuccessEmbed(
        "Your character was unlinked and all your data has been erased.",
      );
      await interaction.editReply({ content: " ", embeds: [embed], components: [] });
    } catch (_error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Your data could not be (fully) deleted. Please try again later.",
      );
      await interaction.editReply({ content: " ", embeds: [embed], components: [] });
    }
  }

  private static async handleVerification(
    interaction: ButtonInteraction,
    userId: string,
    verificationCode: string,
    characterId: number,
  ) {
    const verification = await VerificationsRepository.find(userId);

    if (verification?.characterId === characterId && verification.isVerified) {
      const embed = DiscordEmbedService.getSuccessEmbed(`You already verified this character.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const character = await NaagostoneApiService.fetchCharacterById(characterId);

    if (!character) {
      const embed = DiscordEmbedService.getErrorEmbed(`Could not fetch your character.\nPlease try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const charBio = character.bio?.html;

    if (!charBio.includes(verificationCode)) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Your lodestone bio does not match your verification code." +
          `\nVerification code: \`${verificationCode}\`\nYour current bio: \`${charBio}\``,
      );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    try {
      if (verification) {
        ThemeRepository.get(verification.characterId)
          .then((theme) => ThemeRepository.set(userId, characterId, theme))
          .catch((error) => log.error("Failed to update theme after verification", error));
      }

      await VerificationsRepository.setVerification(userId, characterId);

      const embed = DiscordEmbedService.getSuccessEmbed(
        `Congratulations, ${character.name}! You are now verified.` +
          "\nYou no longer have to keep the verification code in your bio.",
      );
      await interaction.editReply({ content: "", embeds: [embed], components: [] });
    } catch (_error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed(`Character could not be verified. Please try again later.`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }
}
