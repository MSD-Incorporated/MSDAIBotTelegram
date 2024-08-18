import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { Bot, InlineKeyboard } from "grammy";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const version = process.env.npm_package_version;

const parser = (str: string) => {
	str = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");

	str = str.replace(/```(.*)\n([\s\S]*?)```/gm, val => {
		const language = val.split(/\s+/)[0]!.slice(3).replace("c#", "csharp").replace("c++", "cpp");

		val = val.replace(
			/```(.*)\n([\s\S]*?)```/gm,
			`<pre><code class="language-${language}">${val.slice(3 + language.length + 1, val.length - 4)}</code></pre>`
		);

		return val;
	});

	return str
		.replace(/^(\s+|)\*(\s+)(.*)*$/gm, val => {
			val = val.replace("*", `<b>${val.indexOf("*") <= 1 ? " " : ""}•</b>`);

			return val;
		})
		.replace(/`([\s\S]*?)`/gm, val => `<code>${val.slice(1, val.length - 1)}</code>`)
		.replace(/\*\*(.*)\*\*/gm, "<b>$1</b>")
		.replace(/\*(.*)\*/gm, "<b>$1</b>");
};

const client = new Bot(process.env.TOKEN);

client.command("start", async ctx => {
	return ctx.reply(
		[
			"Добро пожаловать!",
			"Чтобы задать свой вопрос используйте: /gemini [текст запроса]",
			"Пример: /gemini Привет, как дела?",
			"Версия gemini: gemini-1.5-pro \n",
			`Текущий билд: <code>${version}</code>`,
		].join("\n"),
		{
			parse_mode: "HTML",
			reply_markup: new InlineKeyboard().add({
				text: "🔗 • Github",
				url: "https://github.com/MSD-Incorporated/MSDAIBotTelegram",
			}),
		}
	);
});

client.command("gemini", async ctx => {
	if (![654382771, 946070039, 825720828, 629401289, -1001705068191].includes(ctx.chatId)) return;
	const args = ctx.msg.text.split(/\s+/).slice(1);
	if (!args.length) return ctx.reply("Не удалось найти запрос...");

	const msg = await ctx.reply("Подождите, ответ генерируется...", { reply_parameters: { message_id: ctx.msgId } });
	await ctx.replyWithChatAction("typing");

	const result = await model.generateContent(args.join(" "));
	const response = result.response;
	const text = response.text();
	const str = parser(text).slice(0, 4096);

	return ctx.api
		.editMessageText(msg.chat.id, msg.message_id, str, {
			parse_mode: "HTML",
		})
		.catch(err => {
			ctx.api.editMessageText(
				msg.chat.id,
				msg.message_id,
				"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram"
			);
			console.error(err);
		});
});

client.start({ drop_pending_updates: true, onStart: () => console.log("Bot started!") });
