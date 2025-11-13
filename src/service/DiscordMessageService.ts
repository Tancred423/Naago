import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";

export class DiscordMessageService {
  public static async editReplySuccess(
    interaction: ContextMenuCommandInteraction | ButtonInteraction | ChatInputCommandInteraction,
    message: string,
  ): Promise<void> {
    const embed = DiscordEmbedService.getSuccessEmbed(message);
    await interaction.editReply({ content: " ", embeds: [embed] });
  }

  public static async editReplyError(
    interaction: ContextMenuCommandInteraction | ButtonInteraction | ChatInputCommandInteraction,
    message: string,
  ): Promise<void> {
    const embed = DiscordEmbedService.getErrorEmbed(message);
    await interaction.editReply({ content: " ", embeds: [embed] });
  }

  public static async deleteAndFollowUpEphemeralError(
    interaction: ContextMenuCommandInteraction | ButtonInteraction | ChatInputCommandInteraction,
    message: string,
  ): Promise<void> {
    const embed = DiscordEmbedService.getErrorEmbed(message);
    await interaction.deleteReply();
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
