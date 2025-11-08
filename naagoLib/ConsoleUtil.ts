import moment from "npm:moment@^2.30.1";
import "npm:moment-timezone@^0.5.48";

export default class ConsoleUtil {
  static logError(message: string, error: any): void {
    const date = moment().tz("Europe/Berlin").format("YYYY-MM-DD HH:mm:ss");
    console.error(`${date} [ERROR] ${message}`, error);
  }
}
