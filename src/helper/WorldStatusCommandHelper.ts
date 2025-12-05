import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { PhysicalDataCenter, World } from "../naagostone/type/WorldStatus.ts";
import { DiscordColorService } from "../service/DiscordColorService.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";

const emojiServerOnline = Deno.env.get("EMOJI_SERVER_ONLINE") ?? "🟢";
const emojiServerPartialMaintenance = Deno.env.get("EMOJI_SERVER_PARTIAL_MAINTENANCE") ?? "🟡";
const emojiServerMaintenance = Deno.env.get("EMOJI_SERVER_MAINTENANCE") ?? "🔴";
const emojiServerNewCharactersAllowed = Deno.env.get("EMOJI_SERVER_NEW_CHARACTERS_ALLOWED") ?? "✅";
const emojiServerNewCharactersUnavailable = Deno.env.get("EMOJI_SERVER_NEW_CHARACTERS_UNAVAILABLE") ?? "❌";
const emojiServerPreferredPlus = Deno.env.get("EMOJI_SERVER_PREFERRED_PLUS") ?? "💚";
const emojiServerPreferred = Deno.env.get("EMOJI_SERVER_PREFERRED") ?? "🟢";
const emojiServerStandard = Deno.env.get("EMOJI_SERVER_STANDARD") ?? "🟡";
const emojiServerCongested = Deno.env.get("EMOJI_SERVER_CONGESTED") ?? "🔴";

const regionEmojis: Record<string, string> = {
  "Europe": "🇪🇺",
  "Oceania": "🌏",
  "North America": "🇺🇸",
  "Japan": "🇯🇵",
};

function getCategoryEmoji(category: string): string {
  switch (category) {
    case "Preferred+":
      return emojiServerPreferredPlus;
    case "Preferred":
      return emojiServerPreferred;
    case "Standard":
      return emojiServerStandard;
    case "Congested":
      return emojiServerCongested;
    default:
      return "⚪";
  }
}

function getStatusEmoji(status: string): string {
  if (status === "Online") return emojiServerOnline;
  if (status === "Partial Maintenance") return emojiServerPartialMaintenance;
  return emojiServerMaintenance;
}

function getCharacterCreationEmoji(canCreate: boolean): string {
  return canCreate ? emojiServerNewCharactersAllowed : emojiServerNewCharactersUnavailable;
}

function formatWorld(world: World): string {
  const statusEmoji = getStatusEmoji(world.status);
  const categoryEmoji = getCategoryEmoji(world.category);
  const createEmoji = getCharacterCreationEmoji(world.canCreateNewCharacter);
  return `${statusEmoji} ${createEmoji} ${categoryEmoji} **${world.world}**`;
}

function formatWorldsForField(worlds: World[]): string {
  return worlds.map(formatWorld).join("\n");
}

export class WorldStatusCommandHelper {
  private static cachedWorldStatus: PhysicalDataCenter[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION_MS = 5 * 60 * 1000;

  public static async handlePageSwapButton(
    interaction: ButtonInteraction,
    buttonIdSplit: string[],
  ): Promise<void> {
    const region = buttonIdSplit[1];

    if (!this.isCacheValid()) {
      const loadingEmoji = DiscordEmojiService.getAsMarkdown("EMOJI_LOADING");
      await interaction.message.edit({
        content: `${loadingEmoji} Updating Lodestone data. This might take several seconds.`,
      });
    }

    const message = await this.getWorldStatus(interaction, region);
    await interaction.editReply({ content: "", ...message });
  }

  public static isCacheValid(): boolean {
    const now = Date.now();
    return this.cachedWorldStatus !== null && now - this.cacheTimestamp < this.CACHE_DURATION_MS;
  }

  public static async getWorldStatus(
    interaction: ButtonInteraction | CommandInteraction,
    selectedRegion: string,
  ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> {
    const worldStatus = await this.fetchWorldStatusCached();

    const selectedDC = worldStatus.find((dc) => dc.physicalDataCenter === selectedRegion);
    if (!selectedDC) {
      throw new Error(`Region ${selectedRegion} not found in world status data`);
    }

    const embed = await this.buildEmbed(interaction, selectedDC, this.cacheTimestamp);
    const components = this.buildButtons(selectedRegion, worldStatus);

    return { embeds: [embed], components };
  }

  private static async fetchWorldStatusCached(): Promise<PhysicalDataCenter[]> {
    const now = Date.now();
    if (this.cachedWorldStatus && now - this.cacheTimestamp < this.CACHE_DURATION_MS) {
      return this.cachedWorldStatus;
    }

    this.cachedWorldStatus = await NaagostoneApiService.fetchWorldStatus();
    this.cacheTimestamp = now;
    return this.cachedWorldStatus;
  }

  private static async buildEmbed(
    interaction: ButtonInteraction | CommandInteraction,
    physicalDC: PhysicalDataCenter,
    lastUpdated: number,
  ): Promise<EmbedBuilder> {
    const regionEmoji = regionEmojis[physicalDC.physicalDataCenter] ?? "🌍";

    const embed = new EmbedBuilder()
      .setColor(await DiscordColorService.getBotColorByInteraction(interaction))
      .setTitle(`${regionEmoji} ${physicalDC.physicalDataCenter} Server Status`)
      .setURL("https://eu.finalfantasyxiv.com/lodestone/worldstatus/")
      .setDescription(
        `**Status:** ${emojiServerOnline} Online · ${emojiServerPartialMaintenance} Partial Maintenance · ${emojiServerMaintenance} Maintenance\n` +
          `**Character Creation:** ${emojiServerNewCharactersAllowed} Available · ${emojiServerNewCharactersUnavailable} Unavailable\n` +
          `**Category:** ${emojiServerPreferredPlus} Preferred+ · ${emojiServerPreferred} Preferred · ${emojiServerStandard} Standard · ${emojiServerCongested} Congested`,
      )
      .setTimestamp(new Date(lastUpdated))
      .setFooter({ text: "Last updated" });

    for (const logicalDC of physicalDC.logicalDataCenters) {
      let worldsFormatted = formatWorldsForField(logicalDC.worlds);
      if (worldsFormatted.length > 1024) {
        worldsFormatted = worldsFormatted.substring(0, 1021) + "...";
      }
      embed.addFields({
        name: `${logicalDC.logicalDataCenter}`,
        value: worldsFormatted || "No data available",
        inline: true,
      });
    }

    return embed;
  }

  private static buildButtons(
    currentRegion: string,
    worldStatus: PhysicalDataCenter[],
  ): ActionRowBuilder<ButtonBuilder>[] {
    const buttons = worldStatus.map((dc) => {
      const emoji = regionEmojis[dc.physicalDataCenter] ?? "🌍";
      const isSelected = dc.physicalDataCenter === currentRegion;

      return new ButtonBuilder()
        .setLabel(dc.physicalDataCenter)
        .setEmoji(emoji)
        .setCustomId(`worldstatus.${dc.physicalDataCenter}`)
        .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary);
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    return [row];
  }
}
