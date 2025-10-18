import { Bot, InlineKeyboard } from "grammy";

import { version } from "../package.json" with { type: "json" };
import { autoQuote } from "./auto-quote";
import { gemini } from "./gemini";
import { geminiVersion, onStart } from "./utils";

const client = new Bot(process.env.TOKEN, { client: { apiRoot: process.env.LOCAL_API ?? "https://api.telegram.org" } });

client.use(autoQuote());
client.use(gemini);

const text = [
	"Добро пожаловать! \n",
	"Чтобы задать свой вопрос используйте: /gemini <code>[текст запроса]</code>",
	"Пример: /gemini <code>Привет, как дела?</code> \n",
	`Версия gemini: <code>${geminiVersion}</code>`,
	`Текущий билд: <code>${version}</code> [<code>${GIT_COMMIT}</code>]`,
].join("\n");

const keyboard = new InlineKeyboard().add({
	text: "🔗 • Github",
	url: "https://github.com/MSD-Incorporated/MSDAIBotTelegram",
});

client.command("start", async ctx => ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard }));
client.start({ drop_pending_updates: true, onStart });
