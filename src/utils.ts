import type { UserFromGetMe } from "grammy/types";

/**
 * List of allowed user IDs.
 *
 * @constant {readonly number[]}
 */
export const userIDs: readonly number[] = [654382771, 946070039, 1302930611] as const;

/**
 * The channel ID for a specific Telegram channel.
 *
 * @constant {number}
 */
export const channelID = -1002118873453 as const;

/**
 * Maximum length of a message in Telegram.
 *
 * @constant {number}
 * @see https://core.telegram.org/bots/api#message
 * @see https://limits.tginfo.me
 */
export const maxMessageLength = 4096 as const;

/**
 * Error message when the generated text is too long.
 *
 * @constant {string}
 * @see https://core.telegram.org/bots/api#message
 * @see https://limits.tginfo.me
 */
export const lengthError =
	"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram" as const;

/**
 * Logs a message when the bot starts.
 *
 * @param {UserFromGetMe} user - The user info from the 'getMe' method.
 */
export const onStart = ({ id, username }: UserFromGetMe) => console.log(`${username} [${id}] started!`);

/**
 * Represents the context for Gemini AI conversations.
 *
 * @typedef {Object} GeminiContext
 * @property {"model" | "user"} role - The role in the conversation (either 'model' or 'user').
 * @property {{ text: string }[]} parts - The parts of the conversation containing text.
 */
export type GeminiContext = {
	role: "model" | "user";
	parts: { text: string }[];
};
