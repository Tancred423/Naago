import { load } from "@std/dotenv";
import { eq } from "drizzle-orm";
import { database } from "./connection.ts";
import { topicData } from "./schema/lodestone-news.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import * as log from "@std/log";

await load({ export: true });

log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => `${logRecord.datetime.toISOString()} [${logRecord.levelName}] ${logRecord.msg}`,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

async function backfillLiveLetterTimestamps(): Promise<void> {
  log.info("Fetching topics from API...");
  const apiTopics = await NaagostoneApiService.fetchLatest10Topics();

  log.info(`Fetched ${apiTopics.length} topics from API`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const apiTopic of apiTopics) {
    if (!apiTopic.timestamp_live_letter) {
      skippedCount++;
      continue;
    }

    if (!apiTopic.description?.markdown || apiTopic.description.markdown.trim() === "") {
      log.info(`Skipping topic "${apiTopic.title}" - empty description`);
      skippedCount++;
      continue;
    }

    const existingTopics = await database
      .select()
      .from(topicData)
      .where(eq(topicData.title, apiTopic.title));

    for (const existingTopic of existingTopics) {
      if (existingTopic.timestampLiveLetter) {
        log.info(`Skipping topic "${apiTopic.title}" (id: ${existingTopic.id}) - already has timestamp`);
        continue;
      }

      const timestampLiveLetterSQL = new Date(apiTopic.timestamp_live_letter);

      await database
        .update(topicData)
        .set({ timestampLiveLetter: timestampLiveLetterSQL })
        .where(eq(topicData.id, existingTopic.id));

      log.info(
        `Updated topic "${apiTopic.title}" (id: ${existingTopic.id}) with live letter timestamp: ${timestampLiveLetterSQL.toISOString()}`,
      );
      updatedCount++;
    }
  }

  log.info(`Backfill complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
}

backfillLiveLetterTimestamps()
  .then(() => {
    log.info("Backfill script finished successfully");
    Deno.exit(0);
  })
  .catch((err) => {
    log.error(`Backfill script failed: ${err instanceof Error ? err.stack : String(err)}`);
    Deno.exit(1);
  });
