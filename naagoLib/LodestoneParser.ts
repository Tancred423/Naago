import moment from "npm:moment@^2.30.1";
import TurndownService from "npm:turndown@^7.2.2";
import { decode } from "npm:html-entities@^2.6.0";
import NaagoUtil from "./NaagoUtil.ts";
import { time } from "npm:@discordjs/builders@^0.9.0";

export default class LodestoneParser {
  static decodeHtmlChars(text: string): string {
    return decode(text);
  }

  static convertTimestampToMs(timestamp: any): any {
    return isNaN(timestamp) ? timestamp : timestamp * 1000;
  }

  static convertHtmlToMarkdown(html: string): string {
    if (!html) return html;

    const turndownService = new TurndownService();
    let markdown = turndownService.turndown(html);
    markdown = markdown
      .replaceAll("\\", "")
      .replaceAll("](/lodestone", "](https://eu.finalfantasyxiv.com/lodestone");

    return markdown;
  }

  static convertTag(category: string, tag?: string): string {
    return tag
      ? NaagoUtil.capitalizeFirstLetter(category) +
        ": " +
        tag.replaceAll("[", "").replaceAll("]", "")
      : NaagoUtil.capitalizeFirstLetter(category);
  }

  static convertImageLinks(
    markdown: string,
  ): { description: string; links: string[] } {
    if (!markdown) return { description: markdown, links: [] };

    const imageLinks: string[] = [];
    const paragraphs = markdown.split("\n");
    let imageCounter = 0;

    if (paragraphs[0].startsWith("[![](") || paragraphs[0].startsWith("![](")) {
      paragraphs.shift();
    }

    paragraphs.forEach((item, index, arr) => {
      item = item.trim();

      if (item.startsWith("[![](") || item.startsWith("![](")) {
        const imageLink = item.split("](")[1]?.slice(0, -1);
        if (imageLink && new RegExp(".jpg|.png").test(imageLink)) {
          imageLinks.push(imageLink);
          imageCounter += 1;
        }
      } else if (
        (!item.startsWith("[![](") || item.startsWith("![](")) &&
        item !== "" &&
        imageCounter > 0
      ) {
        arr[index - 1] = `\n\n*${imageCounter} image${
          imageCounter === 1 ? "" : "s"
        }*\n`;
        imageCounter = 0;
      }
    });

    markdown = paragraphs.join("\n");
    if (imageLinks.length === 1) {
      markdown = markdown.replaceAll("*1 image*", "");
    }
    markdown = markdown
      .replaceAll(/\[!\[\].*\?.*\)/g, "")
      .replaceAll(/!\[\].*\?.*\)/g, "")
      .replaceAll(/\n{3,}/g, "\n\n");

    return {
      description: markdown,
      links: imageLinks,
    };
  }

  static convertDates(category: string, markdown: string): any {
    switch (category) {
      case "topics":
        return this.convertDatesTopics(markdown);
      case "notices":
        return this.convertDatesNotices(markdown);
      case "maints":
        return this.convertDatesMaints(markdown);
      case "updates":
      case "status":
        return this.convertDatesUpdatesStatus(markdown);
      default:
        return markdown;
    }
  }

  static convertDatesTopics(markdown: string): string {
    const paragraphs = markdown.split("\n");
    let inBlock = false;

    paragraphs.forEach((item, index, arr) => {
      item = this.cleanItem(item);

      if (inBlock && (item.endsWith("AEDT") || item.endsWith("AEST"))) {
        item = item.split("/")[0].trim();
        let fromDate: moment.Moment | undefined;
        let toDate: moment.Moment | undefined;
        const isToDate = item.includes(" to ");

        if (isToDate) {
          const fromTo = item.split(" to ");
          const from = fromTo[0].replaceAll("GMT", "").trim();
          let to = fromTo[1].replaceAll("GMT", "").trim();

          fromDate = moment.utc(from, "dddd D MMMM H:mm");

          const year = this.isNextYear(from.split(" ")[2], to.split(" ")[2])
            ? (parseInt(fromDate.format("YYYY")) + 1).toString()
            : fromDate.format("YYYY");

          to = year + " " + to;

          toDate = moment.utc(to, "YYYY dddd D MMMM H:mm");

          if (fromDate.isAfter(toDate)) toDate = toDate.add(1, "days");
        } else {
          fromDate = moment.utc(item, "dddd D MMMM H:mm");
        }

        if (fromDate.isValid()) {
          arr[index] = this.getFormattedDate(fromDate, toDate);
        }

        inBlock = false;
      } else if (item.startsWith("__")) {
        inBlock = true;
      }
    });

    return paragraphs.join("\n").replaceAll(/__\*\*\n+/g, "__**\n");
  }

  static convertDatesNotices(markdown: string): string {
    const paragraphs = markdown.split("\n");

    const regexTimeframes =
      /.*Sometime on (?<date>.*) between (?<time1>.*) and (?<time2>.*) \(.*\) \/ \d+:\d+ and \d+:\d+ \(.*\) \/ \d+:\d+ and \d+:\d+ \(.*\)/;

    paragraphs.forEach((item, index, arr) => {
      if (regexTimeframes.test(item)) {
        const groups = item.match(regexTimeframes)!.groups!;
        const start = moment.utc(
          groups.date + " " + groups.time1,
          "MMM. D, YYYY H:mm",
        );
        const end = moment.utc(
          groups.date + " " + groups.time2,
          "MMM. D, YYYY H:mm",
        );

        arr[index] = "・Sometime between " +
          time(start.toDate()) +
          " and " +
          time(end.toDate());
      }
    });

    return paragraphs.join("\n");
  }

  static convertDatesMaints(
    markdown: string,
  ): { details: string; from?: moment.Moment; to?: moment.Moment } {
    const paragraphs = markdown.split("\n");
    const newParagraphs: string[] = [];

    let fromDate: moment.Moment | undefined;
    let toDate: moment.Moment | undefined;

    paragraphs.forEach((item) => {
      const cleanItem = this.cleanItem(item);
      let altered = false;

      if (cleanItem.endsWith("GMT")) {
        fromDate = undefined;
        toDate = undefined;
        const isToDate = cleanItem.includes(" to ");

        if (isToDate) {
          const fromTo = cleanItem.split(" ");
          const from = NaagoUtil.removeIndicesFromArray([...fromTo], 4, 5, 6);
          const to = NaagoUtil.removeIndicesFromArray([...fromTo], 3, 4, 6);

          fromDate = moment.utc(from, "MMM D YYYY H:mm");
          toDate = moment.utc(to, "MMM D YYYY H:mm");

          if (fromDate.isAfter(toDate)) toDate = toDate.add(1, "days");
        } else {
          fromDate = moment.utc(
            cleanItem.replaceAll("GMT", ""),
            "MMM D YYYY H:mm",
          );
        }

        if (fromDate.isValid()) {
          newParagraphs.push(this.getFormattedDate(fromDate, toDate));
          altered = true;
        } else {
          fromDate = undefined;
          toDate = undefined;
        }
      } else if (
        cleanItem.endsWith("AEDT") ||
        cleanItem.endsWith("AEST") ||
        cleanItem.endsWith("BST")
      ) {
        altered = true;
      }

      if (!altered) newParagraphs.push(item);
    });

    return {
      details: newParagraphs.join("\n"),
      from: fromDate,
      to: toDate,
    };
  }

  static convertDatesUpdatesStatus(markdown: string): string {
    const paragraphs = markdown.split("\n");
    const newParagraphs: string[] = [];

    paragraphs.forEach((item) => {
      const cleanItem = this.cleanItem(item);
      let altered = false;

      if (cleanItem.endsWith("GMT")) {
        let fromDate: moment.Moment | undefined;
        let toDate: moment.Moment | undefined;
        const isToDate = cleanItem.includes(" to ");

        if (isToDate) {
          const fromTo = cleanItem.split(" ");
          const from = NaagoUtil.removeIndicesFromArray([...fromTo], 4, 5, 6);
          const to = NaagoUtil.removeIndicesFromArray([...fromTo], 3, 4, 6);

          fromDate = moment.utc(from, "MMM D YYYY H:mm");
          toDate = moment.utc(to, "MMM D YYYY H:mm");

          if (fromDate.isAfter(toDate)) toDate = toDate.add(1, "days");
        } else {
          fromDate = moment.utc(
            cleanItem.replaceAll("GMT", ""),
            "MMM D YYYY H:mm",
          );
        }

        if (fromDate.isValid()) {
          newParagraphs.push(this.getFormattedDate(fromDate, toDate));
          altered = true;
        }
      } else if (
        cleanItem.endsWith("AEDT") ||
        cleanItem.endsWith("AEST") ||
        cleanItem.endsWith("BST")
      ) {
        altered = true;
      }

      if (!altered) newParagraphs.push(item);
    });

    return newParagraphs.join("\n");
  }

  static cleanItem(item: string): string {
    return item
      .replaceAll("From", "")
      .replaceAll("from", "")
      .replaceAll("around", "")
      .replaceAll(".", "")
      .replaceAll(",", "")
      .replaceAll("(", "")
      .replaceAll(")", "")
      .replaceAll("!", "")
      .replaceAll("*", "")
      .replaceAll("\n", "")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  static isNextYear(month1: string, month2: string): boolean {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "October",
      "November",
      "December",
    ];
    return months.indexOf(month2) < months.indexOf(month1);
  }

  static getFormattedDate(from: moment.Moment, to?: moment.Moment): string {
    if (to) {
      return (
        time(from.toDate()) +
        " to " +
        time(to.toDate()) +
        "\nStart: " +
        time(from.toDate(), "R") +
        "\nEnd: " +
        time(to.toDate(), "R")
      );
    } else return time(from.toDate()) + " (" + time(from.toDate(), "R") + ")";
  }

  static removeIndicesFromArray<T>(arr: T[], ...indices: number[]): T[] {
    return arr.filter((_, index) => !indices.includes(index));
  }
}
