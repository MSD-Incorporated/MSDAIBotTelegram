import type { UserFromGetMe } from "grammy/types";

export const userIDs: number[] = [654382771, 946070039, 1302930611] as const;
export const channelID = -1002118873453 as const;

export const onStart = ({ id, username }: UserFromGetMe) => console.log(`${username} [${id}] started!`);

export type GeminiContext = {
	role: "model" | "user";
	parts: { text: string }[];
};
