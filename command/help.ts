import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";
import { HelpCommandHelper } from "../helper/HelpCommandHelper.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Command overview and explanations."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply(await HelpCommandHelper.getProfiles(interaction));
  },
};
