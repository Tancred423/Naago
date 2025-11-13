import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { HelpCommandHelper } from "../helper/HelpCommandHelper.ts";
import { Command } from "./type/Command.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import * as log from "@std/log";

class HelpCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Command overview and explanations.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const message = await HelpCommandHelper.getProfiles(interaction);
      await interaction.reply(message);
    } catch (error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed("An unknown error occured. Please try again later.");
      await interaction.reply({ embeds: [embed] });
      log.error("Failed to send help message", error);
    }
  }
}

export default new HelpCommand();
