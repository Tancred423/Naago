import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "./type/Command.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";
import { WorldStatusCommandHelper } from "../helper/WorldStatusCommandHelper.ts";
import * as log from "@std/log";

class WorldStatusCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("worldstatus")
    .setDescription("Shows server status, characte creation status and server congestion.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      if (!WorldStatusCommandHelper.isCacheValid()) {
        const loadingEmoji = DiscordEmojiService.getAsMarkdown("EMOJI_LOADING");
        await interaction.reply(`${loadingEmoji} Updating Lodestone data. This might take several seconds.`);
        const message = await WorldStatusCommandHelper.getWorldStatus(interaction, "Europe");
        await interaction.editReply({ content: "", ...message });
      } else {
        await interaction.deferReply();
        const message = await WorldStatusCommandHelper.getWorldStatus(interaction, "Europe");
        await interaction.editReply(message);
      }
    } catch (error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed("Failed to fetch world status. Please try again later.");
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
      log.error(`Failed to fetch world status: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }
}

export default new WorldStatusCommand();
