import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { Bot, InlineKeyboard } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const version = process.env.npm_package_version;

const onStart = ({ id, username }: UserFromGetMe) => console.log(`${username} [${id}] started!`);

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
		.replace(/\#\#(.*)/gm, val => `<b>${val.slice(3)}</b>`)
		.replace(/`([\s\S]*?)`/gm, val => `<code>${val.slice(1, val.length - 1)}</code>`)
		.replace(/\*\*(.*)\*\*/gm, "<b>$1</b>")
		.replace(/\*(.*)\*/gm, "<b>$1</b>");
};

const client = new Bot(process.env.TOKEN);

client.command("start", async ctx => {
	return ctx.reply(
		[
			"Добро пожаловать! \n",
			"Чтобы задать свой вопрос используйте: /gemini <code>[текст запроса]</code>",
			"Пример: /gemini <code>Привет, как дела?</code> \n",
			"Версия gemini: <code>gemini-1.5-pro</code>",
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
	if (![654382771, 946070039, 825720828, 629401289, -1001705068191, -1002229012209].includes(ctx.chatId)) return;
	const args = ctx.msg.text.split(/\s+/).slice(1);
	if (!args.length) return ctx.reply("Не удалось найти запрос...");

	await ctx.replyWithChatAction("typing");
	return ctx
		.reply("Подождите, ответ генерируется...", { reply_parameters: { message_id: ctx.msgId } })
		.then(async ({ chat, message_id }) => {
			await model
				.generateContent(args.join(" "))
				.then(({ response }) => {
					const text = response.text();
					const str = parser(text).slice(0, 4096);

					return ctx.api.editMessageText(chat.id, message_id, str, { parse_mode: "HTML" }).catch(err => {
						ctx.api.editMessageText(
							chat.id,
							message_id,
							"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram"
						);
						console.error(err);
					});
				})
				.catch(err => {
					ctx.api.editMessageText(chat.id, message_id, "Произошла неизвестная ошибка");
					console.error(err);
				});
		})
		.catch(err => {
			console.error(err);
		});
});

client.start({ drop_pending_updates: true, onStart });
