import { load } from "@std/dotenv";
import { readdirSync } from "node:fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

await load({ export: true });

const clientId = Deno.env.get("DISCORD_CLIENT_ID")!;
const guildId = Deno.env.get("DISCORD_GUILD_ID")!;
const token = Deno.env.get("DISCORD_TOKEN")!;
const isProd = Deno.env.get("IS_PROD") === "true";

if (isProd) {
  const commands: any[] = [];
  const commandFiles = readdirSync("./commands")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.default.data.toJSON());
  }

  // Owner commands
  const ownerCommands: any[] = [];
  const ownerCommandFiles = readdirSync("./commands/owner")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const ownerFile of ownerCommandFiles) {
    const ownerCommand = await import(`./commands/owner/${ownerFile}`);
    ownerCommands.push(ownerCommand.default.data.toJSON());
  }

  // Register commands
  const rest = new REST({ version: "10" }).setToken(token);

  rest
    .put(Routes.applicationCommands(clientId), { body: commands })
    .then(() =>
      console.log("Successfully registered global application commands.")
    )
    .catch(console.error);

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), {
      body: ownerCommands,
    })
    .then(() =>
      console.log("Successfully registered owner application commands.")
    )
    .catch(console.error);
} else {
  const commands: any[] = [];
  const commandFiles = readdirSync("./commands")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.default.data.toJSON());
  }

  // Owner commands
  const ownerCommandFiles = readdirSync("./commands/owner")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const ownerFile of ownerCommandFiles) {
    const ownerCommand = await import(`./commands/owner/${ownerFile}`);
    commands.push(ownerCommand.default.data.toJSON());
  }

  // Register commands
  const rest = new REST({ version: "10" }).setToken(token);

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() =>
      console.log("Successfully registered guild application commands.")
    )
    .catch(console.error);
}
