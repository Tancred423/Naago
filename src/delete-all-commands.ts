import { REST, Routes } from "discord.js";
import { load } from "@std/dotenv";
import * as log from "@std/log";

await load({ export: true });

const clientId = Deno.env.get("DISCORD_CLIENT_ID")!;
const guildId = Deno.env.get("DISCORD_GUILD_ID")!;
const token = Deno.env.get("DISCORD_TOKEN")!;

const rest = new REST({ version: "10" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: [] })
  .then(() => log.info("Successfully removed all global application (/) commands."))
  .catch(console.error);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
  .then(() => log.info("Successfully removed all guild application (/) commands."))
  .catch(console.error);
