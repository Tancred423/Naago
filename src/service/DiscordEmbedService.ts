import { ColorResolvable, EmbedBuilder } from "discord.js";
import moment from "moment";
import { MaintenanceData } from "../database/schema/lodestone-news.ts";
import { Maintenance } from "../naagostone/type/Maintenance.ts";
import { Notice } from "../naagostone/type/Notice.ts";
import { Topic } from "../naagostone/type/Topic.ts";
import { Update } from "../naagostone/type/Updates.ts";
import { Status } from "../naagostone/type/Status.ts";

const green = Deno.env.get("COLOR_GREEN")!;
const red = Deno.env.get("COLOR_RED")!;

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

export class DiscordEmbedService {
  static getSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder().setColor(green as ColorResolvable).setDescription(
      `✅ ${message}`,
    );
  }

  static getErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder().setColor(red as ColorResolvable).setDescription(
      `:x: ${message}`,
    );
  }

  static getTopicEmbed(topic: Topic): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorTopics as ColorResolvable)
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
      .setTimestamp(moment(topic.date * 1000).toDate());
  }

  static getNoticesEmbed(notice: Notice): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorNotices as ColorResolvable)
      .setAuthor({
        name: notice.tag ?? "Notice",
        iconURL: noticeIconLink,
      })
      .setTitle(notice.title)
      .setURL(notice.link)
      .setDescription(notice.description.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(notice.date);
  }

  static getMaintenanceEmbedFromData(
    maintenanceData: MaintenanceData,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorMaintenances as ColorResolvable)
      .setAuthor({
        name: maintenanceData.tag ?? "Maintenance",
        iconURL: maintenanceIconLink,
      })
      .setTitle(maintenanceData.title)
      .setURL(maintenanceData.link)
      .setDescription(maintenanceData.description)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(maintenanceData.date);
  }

  static getMaintenanceEmbed(maintenance: Maintenance): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorMaintenances as ColorResolvable)
      .setAuthor({
        name: maintenance.tag ?? "Maintenance",
        iconURL: maintenanceIconLink,
      })
      .setTitle(maintenance.title)
      .setURL(maintenance.link)
      .setDescription(maintenance.description.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(maintenance.date);
  }

  static getUpdatesEmbed(update: Update): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorUpdates as ColorResolvable)
      .setAuthor({
        name: "Update",
        iconURL: updateIconLink,
      })
      .setTitle(update.title)
      .setURL(update.link)
      .setDescription(update.description.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(update.date);
  }

  static getStatusEmbed(status: Status): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(colorStatus as ColorResolvable)
      .setAuthor({
        name: status.tag ?? "Status",
        iconURL: statusIconLink,
      })
      .setTitle(status.title)
      .setURL(status.link)
      .setDescription(status.description.markdown)
      .setFooter({
        text: "Lodestone",
        iconURL: lodestoneIconLink,
      })
      .setTimestamp(status.date);
  }
}
