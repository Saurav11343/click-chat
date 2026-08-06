import crypto from "node:crypto";

import ENV from "../../config/env.js";
import MessageTranslation from "./message-translation.model.js";
import TranslationUsage from "./translation-usage.model.js";
import TranslationDailyUsage from "./translation-daily-usage.model.js";

const MONTHLY_HARD_CAP = 400000;
const DAILY_HARD_CAP = 12000;

const getPacificDateParts = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

const getMonthKey = () => {
  const parts = getPacificDateParts();

  return `${parts.find((part) => part.type === "year")?.value}-${
    parts.find((part) => part.type === "month")?.value
  }`;
};

const getDayKey = () => {
  const parts = getPacificDateParts();

  return `${parts.find((part) => part.type === "year")?.value}-${
    parts.find((part) => part.type === "month")?.value
  }-${parts.find((part) => part.type === "day")?.value}`;
};

const getSafeLimit = (configuredLimit, hardCap) => {
  if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) return 0;
  return Math.min(configuredLimit, hardCap);
};

const reserveUsage = async ({
  Model,
  keyField,
  keyValue,
  limit,
  characterCount,
}) => {
  if (limit <= 0 || characterCount > limit) return null;

  const filter = {
    [keyField]: keyValue,
    charactersUsed: { $lte: limit - characterCount },
  };

  const updateExisting = () =>
    Model.findOneAndUpdate(
      filter,
      { $inc: { charactersUsed: characterCount } },
      { returnDocument: "after" },
    );

  let usage = await updateExisting();

  if (!usage) {
    try {
      usage = await Model.create({
        [keyField]: keyValue,
        charactersUsed: characterCount,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      usage = await updateExisting();
    }
  }

  return usage;
};

const releaseUsage = ({ Model, keyField, keyValue, characterCount }) =>
  Model.updateOne(
    { [keyField]: keyValue, charactersUsed: { $gte: characterCount } },
    { $inc: { charactersUsed: -characterCount } },
  );

const createSuspendedError = (period) => {
  const error = new Error(
    `Translation service is suspended because the safe ${period} usage limit has been reached.`,
  );
  error.statusCode = 503;
  error.code = "TRANSLATION_SERVICE_SUSPENDED";
  error.period = period;
  return error;
};

const decodeEntities = (value) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

export const translateMessageContent = async ({
  messageId,
  content,
  targetLanguage,
}) => {
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");
  const cached = await MessageTranslation.findOne({
    message: messageId,
    targetLanguage,
    contentHash,
  }).lean();

  if (cached) return { ...cached, cached: true };

  if (!ENV.TRANSLATION_ENABLED) {
    throw createSuspendedError("configured");
  }

  if (!ENV.GOOGLE_TRANSLATE_API_KEY) {
    const error = new Error("Translation service is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const characterCount = Array.from(content).length;
  const monthKey = getMonthKey();
  const dayKey = getDayKey();
  const monthlyLimit = getSafeLimit(
    ENV.TRANSLATION_MONTHLY_CHARACTER_LIMIT,
    MONTHLY_HARD_CAP,
  );
  const dailyLimit = getSafeLimit(
    ENV.TRANSLATION_DAILY_CHARACTER_LIMIT,
    DAILY_HARD_CAP,
  );
  const monthlyUsage = await reserveUsage({
    Model: TranslationUsage,
    keyField: "monthKey",
    keyValue: monthKey,
    limit: monthlyLimit,
    characterCount,
  });

  if (!monthlyUsage) {
    throw createSuspendedError("monthly");
  }

  const dailyUsage = await reserveUsage({
    Model: TranslationDailyUsage,
    keyField: "dayKey",
    keyValue: dayKey,
    limit: dailyLimit,
    characterCount,
  });

  if (!dailyUsage) {
    await releaseUsage({
      Model: TranslationUsage,
      keyField: "monthKey",
      keyValue: monthKey,
      characterCount,
    });
    throw createSuspendedError("daily");
  }

  try {
    const url = new URL(
      "https://translation.googleapis.com/language/translate/v2",
    );
    url.searchParams.set("key", ENV.GOOGLE_TRANSLATE_API_KEY);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: content,
        target: targetLanguage,
        format: "text",
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message || "Google translation failed.");
    }

    const result = payload?.data?.translations?.[0];

    if (!result?.translatedText) {
      throw new Error("Google returned an empty translation.");
    }

    const translation = await MessageTranslation.create({
      message: messageId,
      targetLanguage,
      contentHash,
      translatedText: decodeEntities(result.translatedText),
      detectedSourceLanguage: result.detectedSourceLanguage || "",
    });

    return { ...translation.toObject(), cached: false };
  } catch (error) {
    if (error?.code === 11000) {
      const concurrentTranslation = await MessageTranslation.findOne({
        message: messageId,
        targetLanguage,
        contentHash,
      }).lean();

      if (concurrentTranslation) {
        return { ...concurrentTranslation, cached: true };
      }
    }

    // Once a request may have reached Google, keep its reservation even when
    // the response or cache write fails. This deliberately over-counts rather
    // than risking billable usage that is missing from the safety ledger.
    throw error;
  }
};
