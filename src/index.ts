import { load } from "@std/dotenv";
import { readdirSync, statSync } from "node:fs";
import {
  ActivityType,
  ButtonInteraction,
  Client,
  Collection,
  CommandInteraction,
  ContextMenuCommandInteraction,
  GatewayIntentBits,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { CanvasRenderingContext2D } from "canvas";
import moment from "moment";
import cron from "node-cron";
import * as log from "@std/log";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import StatusSenderService from "./service/StatusSenderService.ts";
import { DiscordEmbedService } from "./service/DiscordEmbedService.ts";
import { NoticeSenderService } from "./service/NoticeSenderService.ts";
import { TopicSenderService } from "./service/TopicSenderService.ts";
import { MaintenanceSenderService } from "./service/MaintenanceSenderService.ts";
import { UpdateSenderService } from "./service/UpdateSenderService.ts";
import { ButtonInteractionHandler } from "./handler/ButtonInteractionHandler.ts";
import { ModalInteractionHandler } from "./handler/ModalInteractionHandler.ts";
import { Command } from "./command/type/Command.ts";

// Env
await load({ export: true });
const __dirname = dirname(fileURLToPath(import.meta.url));

// Logger
log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => `${logRecord.datetime.toISOString()} [${logRecord.levelName}] ${logRecord.msg}`,
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
  public static client: Client;
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
const lodestoneCheckOnStart = Deno.env.get("LODESTONE_CHECK_ON_START") === "true";

const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as Client & {
  commands: Collection<string, Command>;
};

client.commands = new Collection();

const commandFiles = readdirSync(join(__dirname, "command"))
  .filter((file) => {
    const filePath = join(__dirname, "command", file);
    return (file.endsWith(".ts") || file.endsWith(".js")) &&
      statSync(filePath).isFile();
  });

for (const file of commandFiles) {
  await import(join(__dirname, "command", file))
    .then((command) => {
      client.commands.set(command.default.data.name, command.default);
    })
    .catch((err) => {
      log.error(`Failed to load command file ${file}: ${err instanceof Error ? err.stack : String(err)}`);
    });
}

client.once("clientReady", () => {
  log.info(`Connected: Discord (${client.user?.tag})`);

  GlobalClient.client = client;
  setPresence();

  if (lodestoneCheckOnStart) {
    checkLodestone().catch((err) => {
      log.error(`Lodestone check failed on start: ${err instanceof Error ? err.stack : String(err)}`);
    });
  }

  cron.schedule("1-56/5 * * * *", async () => {
    await checkLodestone().catch((err) => {
      log.error(`Lodestone check failed: ${err instanceof Error ? err.stack : String(err)}`);
    });
    setPresence();
  });
});

function setPresence(): void {
  try {
    client.user?.setPresence({
      activities: [{
        name: "naago.tancred.de",
        type: ActivityType.Custom,
        state: "🔗 naago.tancred.de",
      }],
      status: "online",
    });
  } catch (err) {
    log.error(`Failed to set presence: ${err instanceof Error ? err.stack : String(err)}`);
  }
}

async function checkLodestone(): Promise<void> {
  const results = await Promise.allSettled([
    TopicSenderService.checkForNew(),
    NoticeSenderService.checkForNew(),
    MaintenanceSenderService.checkForNew(),
    UpdateSenderService.checkForNew(),
    StatusSenderService.checkForNew(),
  ]);

  const topics = results[0].status === "fulfilled" ? results[0].value : 0;
  const notices = results[1].status === "fulfilled" ? results[1].value : 0;
  const maintenances = results[2].status === "fulfilled" ? results[2].value : 0;
  const updates = results[3].status === "fulfilled" ? results[3].value : 0;
  const status = results[4].status === "fulfilled" ? results[4].value : 0;

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const serviceNames = ["topics", "notices", "maintenances", "updates", "status"];
      const reason = result.reason instanceof Error ? result.reason.stack : String(result.reason);
      log.error(`Failed to check for new ${serviceNames[index]}: ${reason}`);
    }
  });

  log.info(
    `Sent ${topics} topics, ${notices} notices, ${maintenances} maintenances, ${updates} updates and ${status} status.`,
  );
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      log.error(`Command not found: ${interaction.commandName}`);
      const embed = DiscordEmbedService.getErrorEmbed(
        `Command '${interaction.commandName}' not found. Try redeploying commands.`,
      );
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction as CommandInteraction);
    } catch (err) {
      log.error(
        `Error while executing command '${interaction.commandName}': ${err instanceof Error ? err.stack : String(err)}`,
      );

      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this command.",
      );
      try {
        if (interaction.ephemeral) {
          await interaction.editReply({
            content: "",
            embeds: [embed],
            components: [],
          });
        } else if (interaction.replied || interaction.deferred) {
          await interaction.deleteReply();
          await interaction.followUp({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (error: unknown) {
        log.error(
          `Error while sending error message for command '${interaction.commandName}': ${error instanceof Error ? error.stack : String(error)}`,
        );
      }
    }
  } else if (interaction.isButton()) {
    try {
      await ButtonInteractionHandler.execute(interaction as ButtonInteraction);
    } catch (err) {
      log.error(`Error while executing button '${interaction.customId}': ${err instanceof Error ? err.stack : String(err)}`);
      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this button.",
      );
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isModalSubmit()) {
    try {
      await ModalInteractionHandler.execute(
        interaction as ModalSubmitInteraction,
      );
    } catch (err) {
      log.error(`Error while executing modal '${interaction.customId}': ${err instanceof Error ? err.stack : String(err)}`);
      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this modal.",
      );
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isUserContextMenuCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      log.error(`Command not found: ${interaction.commandName}`);
      const embed = DiscordEmbedService.getErrorEmbed(
        `Command '${interaction.commandName}' not found. Try redeploying commands.`,
      );
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction as ContextMenuCommandInteraction);
    } catch (err) {
      log.error(
        `Error while executing context command '${interaction.commandName}': ${err instanceof Error ? err.stack : String(err)}`,
      );
      const embed = DiscordEmbedService.getErrorEmbed(
        "There was an error while executing this command.",
      );
      if (interaction.ephemeral) {
        await interaction.editReply({
          embeds: [embed],
        });
      } else {
        await interaction.deleteReply();
        await interaction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
});

client.login(token).catch((err) => {
  log.error(`Failed to login to Discord: ${err instanceof Error ? err.stack : String(err)}`);
  Deno.exit(1);
});
