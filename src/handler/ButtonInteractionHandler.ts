import { ButtonInteraction, MessageFlags } from "discord.js";
import { ArrayManipulationService } from "../service/ArrayManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { HelpCommandHelper } from "../helper/HelpCommandHelper.ts";
import { StringManipulationService } from "../service/StringManipulationService.ts";
import { FavoriteCommandHelper } from "../helper/FavoriteCommandHelper.ts";
import { ProfileCommandHandler } from "../helper/ProfileCommandHelper.ts";
import { VerifyCommandHelper } from "../helper/VerifyCommandHelper.ts";
import { WorldStatusCommandHelper } from "../helper/WorldStatusCommandHelper.ts";

export class ButtonInteractionHandler {
  private static cooldown: string[] = [];

  public static async execute(interaction: ButtonInteraction): Promise<void> {
    const userId = interaction.user.id;
    const messageAuthorId = interaction.message.interaction?.user.id;

    const isOnCooldown = this.cooldown.includes(userId);
    if (isOnCooldown) {
      await interaction.deferUpdate();
      return;
    }
    this.cooldown.push(userId);

    setTimeout(() => {
      ArrayManipulationService.removeItemFromArray(this.cooldown, userId);
    }, 1000);

    if (userId !== messageAuthorId) {
      await interaction.deferUpdate();
      const embed = DiscordEmbedService.getErrorEmbed(
        "You cannot interact with commands from someone else.",
      );
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const buttonId = interaction.customId;
    const buttonIdSplit = buttonId.split(".");
    const commandName = buttonIdSplit[0];

    switch (commandName) {
      case "profile": {
        const content = StringManipulationService.buildLoadingText("Generating profile image...");
        await interaction.message.edit({ content });
        await interaction.deferUpdate();
        await ProfileCommandHandler.handlePageSwapButton(interaction, buttonIdSplit);
        break;
      }
      case "verify":
        await interaction.deferUpdate();
        await VerifyCommandHelper.update(interaction, buttonIdSplit);
        break;
      case "favorite":
        await interaction.deferUpdate();
        await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(interaction, buttonIdSplit);
        break;
      case "help":
        await interaction.deferUpdate();
        await HelpCommandHelper.handlePageSwapButton(interaction, buttonIdSplit);
        break;
      case "worldstatus":
        await interaction.deferUpdate();
        await WorldStatusCommandHelper.handlePageSwapButton(interaction, buttonIdSplit);
        break;
      default:
        throw new Error(
          `ButtonUtil#execute: Command '${commandName}' not found.`,
        );
    }
  }
}
