import { CommandInteraction, GuildMember, MessageFlags, PermissionsBitField } from "discord.js";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import { ArrayManipulationService } from "./ArrayManipulationService.ts";

export class DiscordPermissionService {
  static async hasAllPermissions(
    interaction: CommandInteraction,
    member: GuildMember,
    ...permissions: bigint[]
  ): Promise<boolean> {
    let hasAllPermissions = true;

    const neededPerms = new PermissionsBitField(permissions).toArray();
    const missingPermsTmp: bigint[] = [];

    for (const permission of permissions) {
      if (!member.permissions.has(permission, true)) {
        hasAllPermissions = false;
        missingPermsTmp.push(permission);
      }
    }

    const missingPerms = new PermissionsBitField(missingPermsTmp).toArray();

    if (hasAllPermissions) return true;
    else {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Not enough permissions to execute this command.",
      )
        .addFields([
          {
            name: "For this command you will need",
            value: ArrayManipulationService.prettifyPermissionArray(
              neededPerms,
            ),
          },
          {
            name: "But you are missing",
            value: ArrayManipulationService.prettifyPermissionArray(
              missingPerms,
            ),
          },
        ]);

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });

      return false;
    }
  }
}
