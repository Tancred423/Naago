import { load } from "@std/dotenv";
import { readdirSync } from "node:fs";
import {
  ActivityType,
  ButtonInteraction,
  Client,
  Collection,
  CommandInteraction,
  ContextMenuCommandInteraction,
  GatewayIntentBits,
  StringSelectMenuInteraction,
} from "discord.js";
import { CanvasRenderingContext2D } from "canvas";
import moment from "moment";
import cron from "node-cron";
import * as log from "@std/log";

import StatusSenderService from "./service/StatusSenderService.ts";
import { DiscordEmbedService } from "./service/DiscordEmbedService.ts";
import { NoticeSenderService } from "./service/NoticeSenderService.ts";
import { TopicSenderService } from "./service/TopicSenderService.ts";
import { MaintenanceSenderService } from "./service/MaintenanceSenderService.ts";
import { UpdateSenderService } from "./service/UpdateSenderService.ts";
import { ButtonInteractionHandler } from "./handler/ButtonInteractionHandler.ts";
import { SelectMenuInteractionHandler } from "./handler/SelectMenuInteractionHandler.ts";

// Env
await load({ export: true });

// Logger
log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (logRecord) =>
        `${logRecord.datetime.toISOString()} [${logRecord.levelName}] ${logRecord.msg}`,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

// Client
export class GlobalClient {
  static client: Client;
}

// Moment
moment.locale("en");

// Canvas lib - Add roundRect method to CanvasRenderingContext2D
declare module "canvas" {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, w: number, h: number, r: number): this;
  }
}

CanvasRenderingContext2D.prototype.roundRect = function (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): CanvasRenderingContext2D {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

// Discord bot setup
const token = Deno.env.get("DISCORD_TOKEN")!;
const lodestoneCheckOnStart =
  Deno.env.get("LODESTONE_CHECK_ON_START") === "true";

const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as Client & {
  commands: Collection<string, any>;
};

client.commands = new Collection();

const commandFiles = readdirSync("./commands")
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./command/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

try {
  const ownerCommandFiles = readdirSync("./command/owner")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const ownerfile of ownerCommandFiles) {
    const ownerCommand = await import(`./command/owner/${ownerfile}`);
    client.commands.set(ownerCommand.default.data.name, ownerCommand.default);
  }
} catch (error: unknown) {
  if (error instanceof Error) {
    log.error(`No owner commands directory found: ${error.message}`);
  }
}

client.once("ready", () => {
  log.info(`Connected: Discord (${client.user?.tag})`);

  GlobalClient.client = client;
  setPresence();

  try {
    if (lodestoneCheckOnStart) {
      checkLodestone();
    }

    cron.schedule("1-56/5 * * * *", () => {
      checkLodestone();
      setPresence();
    });
  } catch (err) {
    log.error("Lodestone checker failed.", err);
  }
});

function setPresence(): void {
  client.user?.setPresence({
    activities: [{
      name: "naago.tancred.de",
      type: ActivityType.Custom,
      state: "🔗 naago.tancred.de",
    }],
    status: "online",
  });
}

async function checkLodestone(): Promise<void> {
  const topics = await TopicSenderService.checkForNew();
  const notices = await NoticeSenderService.checkForNew();
  const maintenances = await MaintenanceSenderService.checkForNew();
  const updates = await UpdateSenderService.checkForNew();
  const status = await StatusSenderService.checkForNew();

  log.info(
    `Sent ${topics} topics, ${notices} notices, ${maintenances} maintenances, ${updates} updates and ${status} status.`,
  );
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    try {
      await command.execute(interaction as CommandInteraction);
    } catch (err) {
      log.error("Error while executing command.", err);

      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this command.",
      );
      if ((interaction as any).ephemeral) {
        await interaction.editReply({
          embeds: [embed],
        });
      } else {
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    try {
      await ButtonInteractionHandler.execute(interaction as ButtonInteraction);
    } catch (err) {
      log.error("Error while executing button.", err);
      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this button.",
      );
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    try {
      await SelectMenuInteractionHandler.execute(
        interaction as StringSelectMenuInteraction,
      );
    } catch (err) {
      log.error("Error while executing menu.", err);
      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this menu.",
      );
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } else if (interaction.isUserContextMenuCommand()) {
    const command = client.commands.get(interaction.commandName);

    try {
      await command.execute(interaction as ContextMenuCommandInteraction);
    } catch (err) {
      log.error("Error while executing context command.", err);
      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this command.",
      );
      if ((interaction as any).ephemeral) {
        await interaction.editReply({
          embeds: [embed],
        });
      } else {
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      }
    }
  }
});

client.login(token);
