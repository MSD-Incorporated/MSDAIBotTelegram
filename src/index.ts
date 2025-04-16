import { autoQuote } from "@roziscoding/grammy-autoquote";
import { Bot, InlineKeyboard } from "grammy";
import { version } from "../package.json" with { type: "json" };
import { gemini } from "./gemini";
import { onStart } from "./utils";

const client = new Bot(process.env.TOKEN);

client.use(gemini);
client.use(autoQuote());

const text = [
	"Добро пожаловать! \n",
	"Чтобы задать свой вопрос используйте: /gemini <code>[текст запроса]</code>",
	"Пример: /gemini <code>Привет, как дела?</code> \n",
	"Версия gemini: <code>gemini-2.0-flash</code>",
	`Текущий билд: <code>${version}</code>`,
].join("\n");

const keyboard = new InlineKeyboard().add({
	text: "🔗 • Github",
	url: "https://github.com/MSD-Incorporated/MSDAIBotTelegram",
});

client.command("start", async ctx => ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard }));
client.start({ drop_pending_updates: true, onStart });
