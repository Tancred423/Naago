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
} from "npm:discord.js@^14.24.2";
import { CanvasRenderingContext2D } from "npm:canvas@^3.2.0";
import moment from "npm:moment@^2.30.1";
import cron from "npm:node-cron@^3.0.3";
import DiscordUtil from "./naagoLib/DiscordUtil.ts";
import ButtonUtil from "./naagoLib/ButtonUtil.ts";
import SelectMenuUtil from "./naagoLib/SelectMenuUtil.ts";
import GlobalUtil from "./naagoLib/GlobalUtil.ts";
import TopicsUtil from "./naagoLib/TopicsUtil.ts";
import NoticesUtil from "./naagoLib/NoticesUtil.ts";
import MaintenancesUtil from "./naagoLib/MaintenancesUtil.ts";
import UpdatesUtil from "./naagoLib/UpdatesUtil.ts";
import StatusUtil from "./naagoLib/StatusUtil.ts";
import ConsoleUtil from "./naagoLib/ConsoleUtil.ts";

await load({ export: true });

const guildId = Deno.env.get("DISCORD_GUILD_ID")!;
const token = Deno.env.get("DISCORD_TOKEN")!;
const lodestoneCheckOnStart =
  Deno.env.get("LODESTONE_CHECK_ON_START") === "true";
const checkCommandIds = Deno.env.get("CHECK_COMMAND_IDS") === "true";

// Locale
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
const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as Client & {
  commands: Collection<string, any>;
};

client.commands = new Collection();

const commandFiles = readdirSync("./commands")
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

try {
  const ownerCommandFiles = readdirSync("./commands/owner")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const ownerfile of ownerCommandFiles) {
    const ownerCommand = await import(`./commands/owner/${ownerfile}`);
    client.commands.set(ownerCommand.default.data.name, ownerCommand.default);
  }
} catch (err) {
  console.log("No owner commands directory found.");
}

// Discord events
client.once("ready", () => {
  console.log(`Connected: Discord (${client.user?.tag})`);
  client.user?.setPresence({
    activities: [{
      name: "naago.tancred.de",
      type: ActivityType.Custom,
      state: "🔗 naago.tancred.de",
    }],
    status: "online",
  });

  GlobalUtil.client = client;

  // Lodestone checker
  try {
    if (lodestoneCheckOnStart) {
      checkLodestone();
    } else {
      cron.schedule("1-59/15 * * * *", () => {
        checkLodestone();
        client.user?.setPresence({
          activities: [{
            name: "naago.tancred.de",
            type: ActivityType.Custom,
            state: "🔗 naago.tancred.de",
          }],
          status: "online",
        });
      });
    }
  } catch (err) {
    ConsoleUtil.logError("Lodestone checker failed.", err);
  }

  // Update owner command permissions
  updateOwnerCommands(client);
});

async function checkLodestone(): Promise<void> {
  const topics = await TopicsUtil.updateDb();
  const notices = await NoticesUtil.updateDb();
  const maintenances = await MaintenancesUtil.updateDb();
  const updates = await UpdatesUtil.updateDb();
  const status = await StatusUtil.updateDb();

  console.log(
    `[${
      moment().format(
        "YYYY-MM-DD HH:mm",
      )
    }] Sent ${topics} topics, ${notices} notices, ${maintenances} maintenances, ${updates} updates and ${status} status.`,
  );
}

async function updateOwnerCommands(client: Client): Promise<void> {
  const guild = await client.guilds.fetch(guildId);

  if (checkCommandIds) {
    const commands = await guild?.commands.fetch();
    commands?.forEach((command) => {
      console.log(`${command.name}: ${command.id}`);
    });
  }
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    try {
      await command.execute(interaction as CommandInteraction);
    } catch (err) {
      ConsoleUtil.logError("Error while executing command.", err);

      const embed = DiscordUtil.getErrorEmbed(
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
      await ButtonUtil.execute(interaction as ButtonInteraction);
    } catch (err) {
      ConsoleUtil.logError("Error while executing button.", err);
      const embed = DiscordUtil.getErrorEmbed(
        "There was an error while executing this button.",
      );
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    try {
      await SelectMenuUtil.execute(interaction as StringSelectMenuInteraction);
    } catch (err) {
      ConsoleUtil.logError("Error while executing menu.", err);
      const embed = DiscordUtil.getErrorEmbed(
        "There was an error while executing this menu.",
      );
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  } else if (interaction.isContextMenu()) {
    const command = client.commands.get(interaction.commandName);

    try {
      await command.execute(interaction as ContextMenuCommandInteraction);
    } catch (err) {
      ConsoleUtil.logError("Error while executing context command.", err);
      const embed = DiscordUtil.getErrorEmbed(
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
