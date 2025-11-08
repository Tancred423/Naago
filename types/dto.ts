export interface CharacterData {
  // Add specific character data fields based on your API response
  [key: string]: any;
}

export class CharacterDataDto {
  latestUpdate: Date | string;
  characterData: CharacterData;

  constructor(latestUpdate: Date | string, characterData: CharacterData) {
    this.latestUpdate = latestUpdate;
    this.characterData = characterData;
  }
}
