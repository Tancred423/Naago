import {
  CommandInteraction,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export abstract class Command {
  public abstract readonly data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | ContextMenuCommandBuilder;
  public abstract execute(
    interaction: CommandInteraction | ContextMenuCommandInteraction,
  ): Promise<void>;
}
