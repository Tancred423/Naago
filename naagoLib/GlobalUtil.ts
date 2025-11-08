import type { Client } from "npm:discord.js@^13.17.1";

export default class GlobalUtil {
  static client: Client;
  static stream: any;

  static closeStream(): void {
    if (this.stream) {
      this.stream.close();
      console.log("Twitter stream closed");
    }
  }
}
