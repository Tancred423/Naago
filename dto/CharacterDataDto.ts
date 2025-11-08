import { Moment } from "moment";
import { Character } from "./CharacterDto.ts";

export default class CharacterDataDto {
  latestUpdate: Moment;
  characterData: Character;

  constructor(latestUpdate: Moment, characterData: Character) {
    this.latestUpdate = latestUpdate;
    this.characterData = characterData;
  }
}
