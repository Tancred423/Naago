import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v10";
import type { ContextMenuCommandInteraction } from "discord.js";
import { FavoritesRepository } from "../db/repository/FavoritesRepository.ts";
import DbUtil from "../naagoLib/DbUtil.ts";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import { MaximumAmountReachedError } from "../db/error/MaximumAmountReachedError.ts";
import { AlreadyInDatabaseError } from "../db/error/AlreadyInDatabaseError.ts";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Add Favorite")
    .setType(ApplicationCommandType.User),
  async execute(interaction: ContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;
    const targetCharacter = await DbUtil.getCharacter(interaction.targetId);

    if (!targetCharacter) {
      await sendError(
        interaction,
        "This user does not have a verified character.",
      );
      return;
    }

    try {
      await FavoritesRepository.addFavorite(
        user.id,
        targetCharacter.id,
        targetCharacter.name,
        `${targetCharacter.server.world} (${targetCharacter.server.dc})`,
      );
      await sendSuccess(
        interaction,
        `\`${targetCharacter.name}\` was added as favorite.`,
      );
    } catch (err: unknown) {
      if (err instanceof MaximumAmountReachedError) {
        await sendError(
          interaction,
          `\`${targetCharacter.name}\` was NOT added as favorite as you already reached the maximum of 25.\nPlease remove a favorite before adding a new one. See \`/favorite remove\`.`,
        );
        return;
      }

      if (err instanceof AlreadyInDatabaseError) {
        await sendSuccess(
          interaction,
          `\`${targetCharacter.name}\` is already a favorite.`,
        );
        return;
      }

      await sendError(
        interaction,
        `An unknown error prevented \`${targetCharacter.name}\` from being added to your favorites. Please try again later.`,
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
