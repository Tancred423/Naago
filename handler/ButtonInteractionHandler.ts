import { ButtonInteraction } from "discord.js";
import Favorite from "../command/favorite.ts";
import Me from "../command/me.ts";
import Find from "../command/find.ts";
import Setup from "../command/setup.ts";
import Verify from "../command/verify.ts";
import { ArrayManipulationService } from "../service/ArrayManipulationService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { HelpCommandHelper } from "../helper/HelpCommandHelper.ts";

export class ButtonInteractionHandler {
  static cooldown: string[] = [];

  static async execute(interaction: ButtonInteraction): Promise<void> {
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
        ephemeral: true,
      });
      return;
    }

    const buttonId = interaction.customId;
    const buttonIdSplit = buttonId.split(".");
    const commandName = buttonIdSplit[0];

    switch (commandName) {
      case "me":
        await interaction.deferUpdate();
        await Me.update(interaction, buttonIdSplit);
        break;
      case "find":
        await interaction.deferUpdate();
        await Find.update(interaction, buttonIdSplit);
        break;
      case "setup":
        await interaction.deferUpdate();
        await Setup.update(interaction, buttonIdSplit);
        break;
      case "verify":
        await interaction.deferUpdate();
        await Verify.update(interaction, buttonIdSplit);
        break;
      case "favorite":
        await interaction.deferUpdate();
        await Favorite.update(interaction, buttonIdSplit); // todo helper methoden aus command rausziehen
        break;
      case "help":
        await interaction.deferUpdate();
        await HelpCommandHelper.update(interaction, buttonIdSplit);
        break;
      default:
        throw new Error(
          `ButtonUtil#execute: Command '${commandName}' not found.`,
        );
    }
  }
}
