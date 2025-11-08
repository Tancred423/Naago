import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v10";
import { ContextMenuCommandInteraction, MessageFlags } from "discord.js";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { NotInDatabaseError } from "../database/error/NotInDatabaseError.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Remove Favorite")
    .setType(ApplicationCommandType.User),
  async execute(interaction: ContextMenuCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.user;
    const targetCharacterDataDto = await FetchCharacterService
      .findVerifiedCharacterByUserId(interaction.targetId);
    if (!targetCharacterDataDto) {
      await sendError(
        interaction,
        "This user does not have a verified character.",
      );
      return;
    }
    const targetCharacter = targetCharacterDataDto.character;

    try {
      await FavoritesRepository.delete(user.id, targetCharacter.id);
      await sendSuccess(
        interaction,
        `\`${targetCharacter.name}\` has been removed from your favorites.`,
      );
    } catch (error: unknown) {
      if (error instanceof NotInDatabaseError) {
        await sendSuccess(
          interaction,
          `\`${targetCharacter.name}\` is not a favorite.`,
        );
        return;
      }

      await sendError(
        interaction,
        `\`${targetCharacter.name}\` could not be removed from your favorites. Please contact Tancred#0001 for help.`,
      );
    }
  },
};

async function sendSuccess(
  interaction: ContextMenuCommandInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getSuccessEmbed(message);

  await interaction.editReply({
    content: " ",
    embeds: [embed],
  });
}

async function sendError(
  interaction: ContextMenuCommandInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getErrorEmbed(message);

  await interaction.editReply({
    content: " ",
    embeds: [embed],
  });
}
