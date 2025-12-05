import { ChatInputCommandInteraction, SlashCommandBuilder, time, TimestampStyles } from "discord.js";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { Command } from "./type/Command.ts";

class LiveLetterCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("liveletter")
    .setDescription("Shows information about the next or current Live Letter.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const newestLiveLetterTopic = await TopicsRepository.getNewestLiveLetterTopic();

    if (!newestLiveLetterTopic || !newestLiveLetterTopic.timestampLiveLetter) {
      await interaction.reply({ content: "No Live Letter is currently planned." });
      return;
    }

    const now = Date.now();
    const timestampMs = newestLiveLetterTopic.timestampLiveLetter.getTime();
    const diffMs = timestampMs - now;
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    if (diffMs > 0) {
      const timestampFull = time(newestLiveLetterTopic.timestampLiveLetter, TimestampStyles.LongDateTime);
      const timestampRelative = time(newestLiveLetterTopic.timestampLiveLetter, TimestampStyles.RelativeTime);
      const embed = DiscordEmbedService.getTopicEmbedFromData(newestLiveLetterTopic);
      await interaction.reply({
        content: `This next Live Letter will be on at ${timestampFull} (${timestampRelative}):`,
        embeds: [embed],
      });
    } else if (diffMs >= -twoHoursInMs) {
      const timestampFull = time(newestLiveLetterTopic.timestampLiveLetter, TimestampStyles.LongDateTime);
      const timestampRelative = time(newestLiveLetterTopic.timestampLiveLetter, TimestampStyles.RelativeTime);
      const embed = DiscordEmbedService.getTopicEmbedFromData(newestLiveLetterTopic);
      await interaction.reply({
        content: `This live letter is currently live! It started at ${timestampFull} (${timestampRelative}):`,
        embeds: [embed],
      });
    } else {
      await interaction.reply({ content: "No Live Letter is currently planned." });
    }
  }
}

export default new LiveLetterCommand();
