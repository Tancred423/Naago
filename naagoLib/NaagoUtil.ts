export default class NaagoUtil {
  static addLeadingZeros(num: number, length: number): string {
    const numString = num.toString();
    if (numString.length >= length) return numString;
    else return "0".repeat(length - numString.length) + numString;
  }

  static getApostropheS(name: string): string {
    return name.endsWith("s") ? "'" : "'s";
  }

  static capitalizeFirstLetter(string: string): string {
    return (
      string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase()
    );
  }

  static prettifyPermissionArray(
    array: string[],
    showAll: boolean = true,
  ): string {
    const pretty: string[] = [];
    array.forEach((element) => {
      const split = element.split("_");
      pretty.push(
        `${this.capitalizeFirstLetter(split[0])} ${
          this.capitalizeFirstLetter(
            split[1] || "",
          )
        }`,
      );
    });

    return pretty.join(", ");
  }

  static getWebsiteName(hostname: string): string {
    switch (hostname) {
      case "github.com":
        return "GitHub";
      case "instagram.com":
        return "Instagram";
      case "reddit.com":
        return "Reddit";
      case "open.spotify.com":
        return "Spotify";
      case "steamcommunity.com":
        return "Steam";
      case "tiktok.com":
        return "TikTok";
      case "twitch.tv":
        return "Twitch";
      case "youtube.com":
        return "YouTube";
      case "twitter.com":
        return "Twitter";
      default:
        return hostname;
    }
  }

  static removeItemFromArray<T>(array: T[], item: T): void {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  static cutString(str: string, maxLength: number, link?: string): string {
    if (str.length <= maxLength) return str;

    const suffix = link ? `\n\n[Read more](${link})` : "...";
    const actualMaxLength = maxLength - suffix.length;

    return str.substring(0, actualMaxLength) + suffix;
  }

  static removeIndicesFromArray<T>(arr: T[], ...indices: number[]): string {
    return arr.filter((_, index) => !indices.includes(index)).join(" ");
  }
}
