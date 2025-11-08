import { randomBytes } from "node:crypto";

export class StringManipulationService {
  static formatName(name: string): string {
    const nameSplit = name.split(" ");
    if (nameSplit.length !== 2) return name;

    const firstName = nameSplit[0];
    const lastName = nameSplit[1];

    return `${firstName.substring(0, 1).toUpperCase()}${
      firstName
        .substring(1)
        .toLowerCase()
    } ${lastName.substring(0, 1).toUpperCase()}${
      lastName
        .substring(1)
        .toLowerCase()
    }`;
  }

  static generateVerificationCode(): string {
    return `naago-${randomBytes(3).toString("hex")}`;
  }

  static capitalizeFirstLetter(string: string): string {
    return (
      string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase()
    );
  }

  static convertTag(category: string, tag: string | null): string {
    return tag
      ? StringManipulationService.capitalizeFirstLetter(category) +
        ": " +
        tag.replaceAll("[", "").replaceAll("]", "")
      : StringManipulationService.capitalizeFirstLetter(category);
  }
}
