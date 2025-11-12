import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CommandInteraction,
  EmbedBuilder,
  time,
} from "discord.js";
import { DiscordColorService } from "../service/DiscordColorService.ts";
import moment from "moment";

export class HelpCommandHelper {
  static async update(
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
        throw new Error(`Help button with ID '${page}' doesn't exist.`);
    }
  }

  static async getProfiles(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<
    { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }
  > {
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setColor(
        await DiscordColorService.getBotColorByInteraction(interaction),
      )
      .setTitle("Help: Character Profiles")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/profile me",
          value:
            "- Get the profile of your verified character.\n- Characters can be verified with `/verify add`.",
          inline: false,
        },
        {
          name: "/profile find",
          value:
            "- Get any character's profile by providing the full character name and the server the character is on.\n- Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Find`. This is faster but requires this user to have a verified character.",
          inline: false,
        },
        {
          name: "/profile favorite",
          value:
            "- A quick access to character profiles.\n- Favorites can be added or removed with `/favorite add` and `/favorite remove` respectively.\n- Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Add Favorite` / `Remove Favorite`. This is faster but requires this user to have a verified character.",
          inline: false,
        },
      ]);

    const component = HelpCommandHelper.getButtons("profiles");

    return {
      embeds: [embed],
      components: [component],
    };
  }

  static async getVerification(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<
    { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }
  > {
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setColor(
        await DiscordColorService.getBotColorByInteraction(interaction),
      )
      .setTitle("Help: Verification")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/verify add",
          value:
            "- Links your FFXIV character to your Discord account.\n- You will have to verify it by changing the bio of your Lodestone profile.\n- Verification is needed to show your profile via `/profile me`, manage and access favorites and to set a theme.",
          inline: false,
        },
        {
          name: "/verify remove",
          value:
            "- Unlinks your FFXIV character from your Discord account.\n- Also removes any other information stored of you including your favorites and your chosen theme.",
          inline: false,
        },
      ]);

    const component = HelpCommandHelper.getButtons("verification");

    return {
      embeds: [embed],
      components: [component],
    };
  }

  static async getFavorites(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<
    { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }
  > {
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setColor(
        await DiscordColorService.getBotColorByInteraction(interaction),
      )
      .setTitle("Help: Favorites")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/favorite add",
          value:
            "- Save any character as favorite.\n- You can then access them quickly with `/profile favorite`.\n- You can have up to 25 favorites.",
          inline: false,
        },
        {
          name: "/favorite remove",
          value: "- Remove one of your favorites.",
          inline: false,
        },
      ]);

    const component = HelpCommandHelper.getButtons("favorites");

    return {
      embeds: [embed],
      components: [component],
    };
  }

  static async getSetup(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<
    { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }
  > {
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setColor(
        await DiscordColorService.getBotColorByInteraction(interaction),
      )
      .setTitle("Help: Setup")
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields([
        {
          name: "/setup lodestone",
          value:
            `- Set up which channels receive automated Lodestone news updates.\n- You can set or remove channels for each category of news.\n- The Lodestone news categories are:\n  - Topic (Latest news, PLL's and patch notes)\n  - Notice (Secondary news)\n  - Maintenance (All kind of maintenances and their durations)\n  - Update (Outcome from maintenances)\n  - Status (Technical difficulties and server statuses)\n- By default, this command requires \`Manage Channels\` permission to execute.`,
          inline: false,
        },
        {
          name: "/setup theme",
          value: "- Set a theme for your verified character's profile.",
          inline: false,
        },
      ]);

    const component = HelpCommandHelper.getButtons("setup");

    return {
      embeds: [embed],
      components: [component],
    };
  }

  static async getTechnical(
    interaction: ButtonInteraction | CommandInteraction,
  ): Promise<
    { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] }
  > {
    const client = interaction.client;
    const uptimeFormatted = time(
      moment().subtract(client.uptime!, "ms").toDate(),
      "R",
    );

    const embed = new EmbedBuilder()
      .setColor(
        await DiscordColorService.getBotColorByInteraction(interaction),
      )
      .setTitle("Help: Technical")
      .addFields([
        { name: "Ping", value: `${client.ws.ping} ms`, inline: true },
        { name: "Latest restart", value: uptimeFormatted, inline: true },
        {
          name: "Servers",
          value: (await client.guilds.fetch())?.size.toString(),
          inline: true,
        },
      ]);

    const component = HelpCommandHelper.getButtons("technical");

    return {
      embeds: [embed],
      components: [component],
    };
  }

  static getButtons(currentPage: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Character Profile")
        .setCustomId("help.profiles")
        .setStyle(currentPage === "profiles" ? 1 : 2),
      new ButtonBuilder()
        .setLabel("Verification")
        .setCustomId("help.verification")
        .setStyle(currentPage === "verification" ? 1 : 2),
      new ButtonBuilder()
        .setLabel("Favorites")
        .setCustomId("help.favorites")
        .setStyle(currentPage === "favorites" ? 1 : 2),
      new ButtonBuilder()
        .setLabel("Setup")
        .setCustomId("help.setup")
        .setStyle(currentPage === "setup" ? 1 : 2),
      new ButtonBuilder()
        .setLabel("Technical")
        .setCustomId("help.technical")
        .setStyle(currentPage === "technical" ? 1 : 2),
    );
  }
}
