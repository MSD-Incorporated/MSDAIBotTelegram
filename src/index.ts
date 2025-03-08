import { Bot, InlineKeyboard } from "grammy";
import { onStart, version } from "./constants";
import { gemini } from "./gemini";

const client = new Bot(process.env.TOKEN);

client.use(gemini);

client.command("start", async ctx => {
	console.log(ctx.message);

	return ctx.reply(
		[
			"Добро пожаловать! \n",
			"Чтобы задать свой вопрос используйте: /gemini <code>[текст запроса]</code>",
			"Пример: /gemini <code>Привет, как дела?</code> \n",
			"Версия gemini: <code>gemini-2.0-flash</code>",
			`Текущий билд: <code>${version}</code>`,
		].join("\n"),
		{
			reply_parameters: { message_id: ctx.msgId },
			parse_mode: "HTML",
			reply_markup: new InlineKeyboard().add({
				text: "🔗 • Github",
				url: "https://github.com/MSD-Incorporated/MSDAIBotTelegram",
			}),
		}
	);
});

client.start({ drop_pending_updates: true, onStart });
