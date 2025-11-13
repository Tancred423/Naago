import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  time,
} from "discord.js";
import { DiscordColorService } from "../service/DiscordColorService.ts";
import { InvalidHelpPageError } from "./error/InvalidHelpPageError.ts";
import moment from "moment";

export class HelpCommandHelper {
  public static async handlePageSwapButton(
    interaction: ButtonInteraction,
    buttonIdSplit: string[],
  ): Promise<void> {
    const page = buttonIdSplit[1];
    switch (page) {
      case "profiles":
        await interaction.editReply(await this.getProfiles(interaction));
        break;
      case "verification":
        await interaction.editReply(await this.getVerification(interaction));
        break;
      case "favorites":
        await interaction.editReply(await this.getFavorites(interaction));
        break;
      case "setup":
        await interaction.editReply(await this.getSetup(interaction));
        break;
      case "technical":
        await interaction.editReply(await this.getTechnical(interaction));
        break;
      default:
        throw new InvalidHelpPageError(page);
    }
  }

  public static async getProfiles(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> {
    const client = interaction.client;
    const component = HelpCommandHelper.getButtons("profiles");
    const embed = new EmbedBuilder()
      .setColor(await DiscordColorService.getBotColorByInteraction(interaction))
      .setTitle("Help: Character Profiles")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/profile me",
          value: "- Get the profile of your verified character.\n- Characters can be verified with `/verify add`.",
          inline: false,
        },
        {
          name: "/profile find",
          value:
            "- Get any character's profile by providing the full character name and the server the character is on." +
            "\n- Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Find`. This is faster but requires this user to have a verified character.",
          inline: false,
        },
        {
          name: "/profile favorite",
          value:
            "- A quick access to character profiles.\n- Favorites can be added or removed with `/favorite add` and `/favorite remove` respectively." +
            "\n- Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Add Favorite` / `Remove Favorite`. This is faster but requires this user to have a verified character.",
          inline: false,
        },
      ]);

    return {
      embeds: [embed],
      components: [component],
    };
  }

  private static async getVerification(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> {
    const client = interaction.client;
    const component = HelpCommandHelper.getButtons("verification");
    const embed = new EmbedBuilder()
      .setColor(await DiscordColorService.getBotColorByInteraction(interaction))
      .setTitle("Help: Verification")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/verify add",
          value: "- Links your FFXIV character to your Discord account." +
            "\n- You will have to verify it by changing the bio of your Lodestone profile." +
            "\n- Verification is needed to show your profile via `/profile me`, manage and access favorites and to set a theme.",
          inline: false,
        },
        {
          name: "/verify remove",
          value: "- Unlinks your FFXIV character from your Discord account." +
            "\n- Also removes any other information stored of you including your favorites and your chosen theme.",
          inline: false,
        },
      ]);

    return {
      embeds: [embed],
      components: [component],
    };
  }

  private static async getFavorites(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> {
    const client = interaction.client;
    const component = HelpCommandHelper.getButtons("favorites");
    const embed = new EmbedBuilder()
      .setColor(await DiscordColorService.getBotColorByInteraction(interaction))
      .setTitle("Help: Favorites")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/favorite add",
          value: "- Save any character as favorite." +
            "\n- You can then access them quickly with `/profile favorite`." +
            "\n- You can have up to 25 favorites.",
          inline: false,
        },
        {
          name: "/favorite remove",
          value: "- Remove one of your favorites.",
          inline: false,
        },
      ]);

    return {
      embeds: [embed],
      components: [component],
    };
  }

  private static async getSetup(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> {
    const client = interaction.client;
    const component = HelpCommandHelper.getButtons("setup");
    const embed = new EmbedBuilder()
      .setColor(await DiscordColorService.getBotColorByInteraction(interaction))
      .setTitle("Help: Setup")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/setup lodestone",
          value: `- Set up which channels receive automated Lodestone news updates.` +
            "\n- You can set or remove channels for each category of news." +
            "\n- The Lodestone news categories are:" +
            "\n  - Topic (Latest news, PLL's and patch notes)" +
            "\n  - Notice (Secondary news)" +
            "\n  - Maintenance (All kind of maintenances and their durations)" +
            "\n  - Update (Outcome from maintenances)" +
            "\n  - Status (Technical difficulties and server statuses)" +
            "\n- By default, this command requires \`Manage Channels\` permission to execute.",
          inline: false,
        },
        {
          name: "/setup theme",
          value: "- Set a theme for your verified character's profile.",
          inline: false,
        },
      ]);

    return {
      embeds: [embed],
      components: [component],
    };
  }

  private static async getTechnical(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }> {
    const client = interaction.client;
    const component = HelpCommandHelper.getButtons("technical");
    const uptimeFormatted = time(moment().subtract(client.uptime!, "ms").toDate(), "R");
    const embed = new EmbedBuilder()
      .setColor(await DiscordColorService.getBotColorByInteraction(interaction))
      .setTitle("Help: Technical")
      .addFields([
        { name: "Ping", value: `${client.ws.ping} ms`, inline: true },
        { name: "Latest restart", value: uptimeFormatted, inline: true },
        { name: "Servers", value: (await client.guilds.fetch())?.size.toString(), inline: true },
      ]);

    return {
      embeds: [embed],
      components: [component],
    };
  }

  private static getButtons(currentPage: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Character Profile")
        .setCustomId("help.profiles")
        .setStyle(currentPage === "profiles" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("Verification")
        .setCustomId("help.verification")
        .setStyle(currentPage === "verification" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("Favorites")
        .setCustomId("help.favorites")
        .setStyle(currentPage === "favorites" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("Setup")
        .setCustomId("help.setup")
        .setStyle(currentPage === "setup" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("Technical")
        .setCustomId("help.technical")
        .setStyle(currentPage === "technical" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    );
  }
}
