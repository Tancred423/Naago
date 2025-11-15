import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { MaximumAmountReachedError } from "../database/error/MaximumAmountReachedError.ts";
import { AlreadyInDatabaseError } from "../database/error/AlreadyInDatabaseError.ts";
import { Command } from "./type/Command.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";

class ContextFavoriteAddCommand extends Command {
  public readonly data = new ContextMenuCommandBuilder()
    .setName("Add Favorite")
    .setType(ApplicationCommandType.User);

  public async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.user;
    const targetCharacterDataDto = await FetchCharacterService.findVerifiedCharacterByUserId(interaction.targetId);

    if (!targetCharacterDataDto) {
      await DiscordMessageService.editReplyError(interaction, "This user does not have a verified character.");
      return;
    }

    const targetCharacter = targetCharacterDataDto.character;

    try {
      await FavoritesRepository.add(
        user.id,
        targetCharacter.id,
      );
      await DiscordMessageService.editReplySuccess(interaction, `\`${targetCharacter.name}\` was added as favorite.`);
    } catch (error: unknown) {
      if (error instanceof MaximumAmountReachedError) {
        await DiscordMessageService.editReplyError(
          interaction,
          `\`${targetCharacter.name}\` was NOT added as favorite as you already reached the maximum of 25.` +
            "\nPlease remove a favorite before adding a new one. See `/favorite remove`.",
        );
        return;
      }

      if (error instanceof AlreadyInDatabaseError) {
        await DiscordMessageService.editReplySuccess(interaction, `\`${targetCharacter.name}\` is already a favorite.`);
        return;
      }

      await DiscordMessageService.editReplyError(
        interaction,
        `An unknown error prevented \`${targetCharacter.name}\` from being added to your favorites. Please try again later.`,
      );
    }
  }
}

export default new ContextFavoriteAddCommand();
