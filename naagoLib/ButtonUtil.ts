import type { ButtonInteraction } from "npm:discord.js@^13.17.1";
import Favorite from "../commands/favorite.ts";
import Me from "../commands/me.ts";
import Find from "../commands/find.ts";
import Setup from "../commands/setup.ts";
import Verify from "../commands/verify.ts";
import DiscordUtil from "./DiscordUtil.ts";
import HelpUtil from "./HelpUtil.ts";
import NaagoUtil from "./NaagoUtil.ts";

export default class ButtonUtil {
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
      NaagoUtil.removeItemFromArray(this.cooldown, userId);
    }, 1000);

    if (userId !== messageAuthorId) {
      await interaction.deferUpdate();
      const embed = DiscordUtil.getErrorEmbed(
        "You cannot interact with commands from someone else.",
      );
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    const buttonId = interaction.component.customId!;
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
        await Favorite.update(interaction, buttonIdSplit);
        break;
      case "help":
        await interaction.deferUpdate();
        await HelpUtil.update(interaction, buttonIdSplit);
        break;
      default:
        throw new Error(
          `ButtonUtil#execute: Command '${commandName}' not found.`,
        );
    }
  }
}
