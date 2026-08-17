export const SLACK_EMOJI_SIZE_LIMIT = 128 * 1024; // 128 KiB
export const DISCORD_EMOJI_SIZE_LIMIT = 256 * 1024; // 256 KiB

export type SizeWarningLevel = "ok" | "slack" | "both";

export function checkEmojiSize(maxBytes: number): SizeWarningLevel {
  if (maxBytes > DISCORD_EMOJI_SIZE_LIMIT) {
    return "both";
  }
  if (maxBytes > SLACK_EMOJI_SIZE_LIMIT) {
    return "slack";
  }
  return "ok";
}

export function formatKiB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
