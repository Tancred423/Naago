import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";
import { NotInDatabaseError } from "../database/error/NotInDatabaseError.ts";
import { CharacterDataRepository } from "../database/repository/CharacterDataRepository.ts";
import { Character } from "../naagostone/type/CharacterTypes.ts";

export class FavoriteCommandHelper {
  public static async handleRemoveFavoriteModal(interaction: ModalSubmitInteraction): Promise<void> {
    const fields = interaction.fields;
    const targetCharacterIds = fields.getStringSelectValues("favorite_character_remove");

    if (targetCharacterIds.length !== 1) {
      throw new Error(`Found \`${targetCharacterIds.length}\` select values. Expected 1.`);
    }

    const characterId = parseInt(targetCharacterIds[0]);
    const characterData = await CharacterDataRepository.find(characterId);
    const characterName = characterData
      ? (JSON.parse(characterData.jsonString) as Character).name
      : characterId.toString();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("favorite.unset.cancel")
        .setLabel("No, cancel.")
        .setStyle(2),
      new ButtonBuilder()
        .setCustomId(`favorite.unset.${characterId}`)
        .setLabel("Yes, remove them.")
        .setStyle(4),
    );

    await interaction.reply({
      content: `Are you sure you want to remove \`${characterName}\` from your favorites?`,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }

  public static async handleRemoveFavoriteConfirmationButton(
    interaction: ButtonInteraction,
    buttonIdSplit: string[],
  ): Promise<void> {
    if (buttonIdSplit.length === 3 && buttonIdSplit[2] === "cancel") {
      const embed = DiscordEmbedService.getSuccessEmbed("Cancelled.");
      await interaction.editReply({ content: " ", components: [], embeds: [embed] });
      return;
    }

    if (buttonIdSplit.length !== 3) {
      throw new Error("button id length is !== 3");
    }

    const userId = interaction.user.id;
    const characterId = parseInt(buttonIdSplit[2]);
    const characterData = await CharacterDataRepository.find(characterId);
    const characterName = characterData
      ? (JSON.parse(characterData.jsonString) as Character).name
      : characterId.toString();

    try {
      await FavoritesRepository.delete(userId, characterId);
      await DiscordMessageService.editReplySuccess(
        interaction,
        `\`${characterName}\` has been removed from your favorites.`,
      );
    } catch (error: unknown) {
      if (error instanceof NotInDatabaseError) {
        await DiscordMessageService.editReplyError(interaction, `${characterName} is not in your favorites.`);
        return;
      }

      await DiscordMessageService.editReplyError(
        interaction,
        `An unknown error prevented \`${characterName}\` from being removed from your favorites. Please try again later.`,
      );
    }
  }
}
