import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  Guild,
  GuildEmoji,
  GuildMember,
  PermissionsBitField,
} from "npm:discord.js@^14.24.2";
import NaagoUtil from "./NaagoUtil.ts";
import moment from "npm:moment@^2.30.1";

const green = Deno.env.get("COLOR_GREEN")!;
const red = Deno.env.get("COLOR_RED")!;
const blurple = Deno.env.get("COLOR_BLURPLE")!;
const colorTopics = Deno.env.get("COLOR_TOPICS")!;
const colorNotices = Deno.env.get("COLOR_NOTICES")!;
const colorMaintenances = Deno.env.get("COLOR_MAINTENANCES")!;
const colorUpdates = Deno.env.get("COLOR_UPDATES")!;
const colorStatus = Deno.env.get("COLOR_STATUS")!;
const topicIconLink = Deno.env.get("ICON_TOPICS")!;
const noticeIconLink = Deno.env.get("ICON_NOTICES")!;
const maintenanceIconLink = Deno.env.get("ICON_MAINTENANCES")!;
const updateIconLink = Deno.env.get("ICON_UPDATES")!;
const statusIconLink = Deno.env.get("ICON_STATUS")!;
const lodestoneIconLink = Deno.env.get("ICON_LODESTONE")!;

type EmoteName =
  | "github"
  | "instagram"
  | "reddit"
  | "spotify"
  | "steamcommunity"
  | "tiktok"
  | "twitch"
  | "youtube"
  | "twitter"
  | "loading"
  | "theme_dark"
  | "theme_light"
  | "theme_classic"
  | "theme_clear_blue"
  | "theme_final_days"
  | "theme_ultima_thule"
  | "theme_moon"
  | "theme_amaurot"
  | "theme_character_selection"
  | "maintenances"
  | "notices"
  | "status"
  | "topics"
  | "updates"
  | "doggo_smile";

export default class DiscordUtil {
  static getSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder().setColor(green).setDescription(`✅ ${message}`);
  }

  static getErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder().setColor(red).setDescription(`:x: ${message}`);
  }

  static async getBotColorByInteraction(
    interaction: CommandInteraction,
  ): Promise<string> {
    const botId = interaction.client.user?.id;
    const guild = interaction.guild;
    if (!guild || !botId) return blurple;
    const member = await guild.members.fetch(botId);
    if (!member) return blurple;
    const displayHexColor = member.displayHexColor;
    if (displayHexColor === "#000000") return blurple;

    return displayHexColor;
  }

  static async getBotColorByClientGuild(
    client: Client,
    guild: Guild,
  ): Promise<string> {
    if (!client || !guild || !client.user) return blurple;
    const botId = client.user.id;
    const member = await guild.members.fetch(botId);
    if (!member) return blurple;
    const displayHexColor = member.displayHexColor;
    if (displayHexColor === "#000000") return blurple;

    return displayHexColor;
  }

  static async getEmote(
    client: Client,
    name: EmoteName,
  ): Promise<GuildEmoji | null> {
    const naagoEmoteServerId = "915541034220531772";
    const naagoEmoteServer = await client.guilds.fetch(naagoEmoteServerId);
    if (!naagoEmoteServer) return null;

    const emoteMap: Record<EmoteName, string> = {
      github: "921485435346251797",
      instagram: "921485626006700043",
      reddit: "921485728251260959",
      spotify: "921485793531408415",
      steamcommunity: "921485862506745857",
      tiktok: "921485973186031696",
      twitch: "915541076763365427",
      youtube: "915541076977254411",
      twitter: "915541076989861908",
      loading: "918998950885875762",
      theme_dark: "922677850543357982",
      theme_light: "922677850480467979",
      theme_classic: "922677850522390529",
      theme_clear_blue: "1063108616502120458",
      theme_final_days: "922681780606230629",
      theme_ultima_thule: "932065506343657502",
      theme_moon: "922718025654886400",
      theme_amaurot: "922699017337597952",
      theme_character_selection: "922709333639311422",
      maintenances: "922959045193793557",
      notices: "922959045256679444",
      status: "922959045378326578",
      topics: "922959045277650994",
      updates: "922959045466398770",
      doggo_smile: "924901318718521415",
    };

    const emoteId = emoteMap[name];
    if (!emoteId) return null;

    return await naagoEmoteServer.emojis.fetch(emoteId);
  }

  static async hasAllPermissions(
    interaction: CommandInteraction,
    member: GuildMember,
    ...permissions: bigint[]
  ): Promise<boolean> {
    let hasAllPermissions = true;

    const neededPerms = new Permissions(permissions).toArray();
    const missingPermsTmp: bigint[] = [];

    for (const permission of permissions) {
      if (!member.permissions.has(permission, true)) {
        hasAllPermissions = false;
        missingPermsTmp.push(permission);
      }
    }

    const missingPerms = new Permissions(missingPermsTmp).toArray();

    if (hasAllPermissions) return true;
    else {
      const embed = DiscordUtil.getErrorEmbed(
        "Not enough permissions to execute this command.",
      )
        .addField(
          "For this command you will need",
          NaagoUtil.prettifyPermissionArray(neededPerms, false),
        )
        .addField(
          "But you are missing",
          NaagoUtil.prettifyPermissionArray(missingPerms),
          false,
        );

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });

      return false;
    }
  }

  static getTopicEmbed(topic: any): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorTopics)
      .setAuthor({
        name: "Topic",
        iconURL: topicIconLink,
      })
      .setTitle(topic.title)
      .setURL(topic.link)
      .setDescription(topic.description.markdown)
      .setImage(topic.banner)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(moment(topic.date).toDate());
  }

  static getNoticesEmbed(notice: any): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorNotices)
      .setAuthor({
        name: notice.tag,
        iconURL: noticeIconLink,
      })
      .setTitle(notice.title)
      .setURL(notice.link)
      .setDescription(notice.details.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(notice.date);
  }

  static getMaintenanceEmbed(maint: any): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorMaintenances)
      .setAuthor({
        name: maint.tag,
        iconURL: maintenanceIconLink,
      })
      .setTitle(maint.title)
      .setURL(maint.link)
      .setDescription(maint.details.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(maint.date);
  }

  static getUpdatesEmbed(update: any): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorUpdates)
      .setAuthor({
        name: "Update",
        iconURL: updateIconLink,
      })
      .setTitle(update.title)
      .setURL(update.link)
      .setDescription(update.details.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(update.date);
  }

  static getStatusEmbed(status: any): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorStatus)
      .setAuthor({
        name: status.tag,
        iconURL: statusIconLink,
      })
      .setTitle(status.title)
      .setURL(status.link)
      .setDescription(status.details.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(status.date);
  }
}
