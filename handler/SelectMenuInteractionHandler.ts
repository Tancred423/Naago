import { StringSelectMenuInteraction } from "discord.js";
import Favorite from "../command/favorite.ts";
import Theme from "../command/theme.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export class SelectMenuInteractionHandler {
  static async execute(
    interaction: StringSelectMenuInteraction,
  ): Promise<void> {
    const userId = interaction.user.id;
    const messageAuthorId = interaction.message.interaction?.user.id;

    if (userId !== messageAuthorId) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "You cannot interact with menus from someone else.",
      );
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return;
    }

    const menuIdSplit = interaction.customId.split(".");
    const commandName = menuIdSplit[0];
    const action = menuIdSplit[1];

    switch (commandName) {
      case "theme":
        await interaction.deferUpdate();
        await Theme.update(interaction);
        break;
      case "favorite":
        switch (action) {
          case "get":
            await interaction.deferUpdate();
            await Favorite.get(interaction);
            break;
          case "remove":
            await interaction.deferUpdate();
            await Favorite.remove(interaction);
            break;
          default:
            throw new Error(
              "SelectMenuUtil#execute: Favorite action was not 'get' or 'remove'.",
            );
        }
        break;
    }
  }
}
