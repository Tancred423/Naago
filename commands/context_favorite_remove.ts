import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { FavoritesRepository } from "../db/repository/FavoritesRepository.ts";
import { ApplicationCommandType } from "discord-api-types/v10";
import type { ContextMenuCommandInteraction } from "discord.js";
import DbUtil from "../naagoLib/DbUtil.ts";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import { NotInDatabaseError } from "../db/error/NotInDatabaseError.ts";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Remove Favorite")
    .setType(ApplicationCommandType.User),
  async execute(interaction: ContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const invoker = interaction.user;
    const character = await DbUtil.getCharacter(interaction.targetId);

    if (!character) {
      await sendError(
        interaction,
        "This user does not have a verified character.",
      );
      return;
    }

    try {
      await FavoritesRepository.removeFavorite(invoker.id, character.id);
      await sendSuccess(
        interaction,
        `\`${character.name}\` has been removed from your favorites.`,
      );
    } catch (error: unknown) {
      if (error instanceof NotInDatabaseError) {
        await sendSuccess(
          interaction,
          `\`${character.name}\` is not a favorite.`,
        );
        return;
      }

      await sendError(
        interaction,
        `\`${character.name}\` could not be removed from your favorites. Please contact Tancred#0001 for help.`,
      );
    }
  },
};

async function sendSuccess(
  interaction: ContextMenuCommandInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordUtil.getSuccessEmbed(message);

  await interaction.editReply({
    content: " ",
    embeds: [embed],
  });
}

async function sendError(
  interaction: ContextMenuCommandInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordUtil.getErrorEmbed(message);

  await interaction.editReply({
    content: " ",
    embeds: [embed],
  });
}
