import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import HelpUtil from "../naagoLib/HelpUtil.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Command overview and explanations."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply(await HelpUtil.getProfiles(interaction));
  },
};
