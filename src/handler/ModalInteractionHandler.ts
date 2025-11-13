import { ModalSubmitInteraction } from "discord.js";
import { FavoriteCommandHelper } from "../helper/FavoriteCommandHelper.ts";
import { ProfileCommandHandler } from "../helper/ProfileCommandHelper.ts";
import { SetupCommandHelper } from "../helper/SetupCommandHelper.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";
import { InvalidCommandError } from "./error/InvalidCommandError.ts";

export class ModalInteractionHandler {
  static async execute(
    interaction: ModalSubmitInteraction,
  ): Promise<void> {
    const modalIdSplit = interaction.customId.split(".");
    const command = modalIdSplit[0];
    const subCommand = modalIdSplit[1];

    switch (command) {
      case "favorite":
        switch (subCommand) {
          case "remove":
            await FavoriteCommandHelper.handleRemoveFavoriteModal(interaction);
            break;
          default:
            throw new InvalidSubCommandError(subCommand);
        }
        break;
      case "profile":
        switch (subCommand) {
          case "favorite":
            await ProfileCommandHandler.handleFavoriteModal(interaction);
            break;
          default:
            throw new InvalidSubCommandError(subCommand);
        }
        break;
      case "setup":
        switch (subCommand) {
          case "lodestone":
            await SetupCommandHelper.handleLodestoneModal(interaction);
            break;
          case "theme":
            await SetupCommandHelper.handleThemeModal(interaction);
            break;
          default:
            throw new InvalidSubCommandError(subCommand);
        }
        break;
      default:
        throw new InvalidCommandError(command);
    }
  }
}
