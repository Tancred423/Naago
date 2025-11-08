import { Moment } from "moment";
import { Character } from "../../naagostone/type/CharacterTypes.ts";

export class CharacterDataDto {
  latestUpdate: Moment;
  character: Character;

  constructor(latestUpdate: Moment, character: Character) {
    this.latestUpdate = latestUpdate;
    this.character = character;
  }
}
