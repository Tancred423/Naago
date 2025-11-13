import { ButtonInteraction, Client, ColorResolvable, CommandInteraction, Guild } from "discord.js";

const blurple = Deno.env.get("COLOR_BLURPLE")!;

export class DiscordColorService {
  static async getBotColorByInteraction(
    interaction: CommandInteraction | ButtonInteraction,
  ): Promise<ColorResolvable> {
    const botId = interaction.client.user?.id;
    const guild = interaction.guild;
    if (!guild || !botId) return blurple as ColorResolvable;
    const member = await guild.members.fetch(botId);
    if (!member) return blurple as ColorResolvable;
    const displayHexColor = member.displayHexColor;
    if (displayHexColor === "#000000") return blurple as ColorResolvable;

    return displayHexColor as ColorResolvable;
  }

  static async getBotColorByClientGuild(
    client: Client,
    guild: Guild,
  ): Promise<ColorResolvable> {
    if (!client || !guild || !client.user) return blurple as ColorResolvable;
    const botId = client.user.id;
    const member = await guild.members.fetch(botId);
    if (!member) return blurple as ColorResolvable;
    const displayHexColor = member.displayHexColor;
    if (displayHexColor === "#000000") return blurple as ColorResolvable;

    return displayHexColor as ColorResolvable;
  }
}
