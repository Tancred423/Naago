import { ButtonInteraction, CommandInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { CharacterDataRepository } from "../database/repository/CharacterDataRepository.ts";
import { Character } from "../naagostone/type/CharacterTypes.ts";
import moment from "moment";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { CharacterDataDto } from "../naagostone/dto/CharacterDataDto.ts";
import { StringManipulationService } from "./StringManipulationService.ts";
import * as log from "@std/log";

export class FetchCharacterService {
  public static async findVerifiedCharacterByUserId(
    userId: string,
  ): Promise<CharacterDataDto | null> {
    const verification = await VerificationsRepository.find(userId);
    if (!verification) return null;

    const characterData = await CharacterDataRepository.find(verification.characterId);
    if (!characterData) return null;

    const latestUpdate = moment(new Date(characterData.latestUpdate));
    return new CharacterDataDto(latestUpdate, JSON.parse(characterData.jsonString) as Character);
  }

  public static async fetchCharacterCached(
    interaction:
      | CommandInteraction
      | StringSelectMenuInteraction
      | ButtonInteraction
      | ModalSubmitInteraction,
    characterId: number,
  ): Promise<CharacterDataDto | null> {
    const characterData = await CharacterDataRepository.find(characterId);

    if (!characterData) {
      return this.fetchCharacterForced(interaction, characterId);
    }

    const latestUpdate = moment(new Date(characterData.latestUpdate));
    if (latestUpdate.isBefore(moment().subtract(10, "minutes"))) {
      return this.fetchCharacterForced(interaction, characterId);
    }

    return new CharacterDataDto(latestUpdate, JSON.parse(characterData.jsonString) as Character);
  }

  private static async fetchCharacterForced(
    interaction:
      | CommandInteraction
      | StringSelectMenuInteraction
      | ButtonInteraction
      | ModalSubmitInteraction,
    characterId: number,
  ): Promise<CharacterDataDto | null> {
    await this.prepareInteraction(interaction);

    const character = await NaagostoneApiService.fetchCharacterById(characterId);
    if (!character) return null;

    await CharacterDataRepository.set(character);

    log.info("current timestamp", moment().unix());

    return new CharacterDataDto(moment(), character);
  }

  private static async prepareInteraction(
    interaction:
      | CommandInteraction
      | StringSelectMenuInteraction
      | ButtonInteraction
      | ModalSubmitInteraction,
  ): Promise<void> {
    const content = StringManipulationService.buildLoadingText(
      "Updating lodestone data. This might take several seconds.",
    );
    await interaction.editReply({ content });
  }
}
