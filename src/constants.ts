import type { UserFromGetMe } from "grammy/types";

export const version = process.env.npm_package_version;
export const userIDs: number[] = [654382771, 946070039];

export const onStart = ({ id, username }: UserFromGetMe) => console.log(`${username} [${id}] started!`);
