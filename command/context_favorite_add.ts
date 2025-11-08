import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v10";
import { ContextMenuCommandInteraction, MessageFlags } from "discord.js";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { MaximumAmountReachedError } from "../database/error/MaximumAmountReachedError.ts";
import { AlreadyInDatabaseError } from "../database/error/AlreadyInDatabaseError.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Add Favorite")
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
      await FavoritesRepository.add(
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
