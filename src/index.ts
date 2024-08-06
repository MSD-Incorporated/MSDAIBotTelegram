import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { Bot } from "grammy";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const parser = (str: string) => {
	str.replace(/<[^>]+>/gm, val => val.replace(/</g, "&lt;").replace(/>/g, "&gt;"));

	if (str.match(/^```(.*)\n([\s\S]*?)```$/gm)) {
		const language = str.split(/\s+/)[0]!.slice(3);

		str = str.replace(
			/^```(.*)\n([\s\S]*?)```$/gm,
			`<pre><code class="language-${language.replace("c#", "csharp").replace("c++", "cpp")}">${str.slice(
				3 + language.replace("c#", "csharp").replace("c++", "cpp").length,
				str.length - 3
			)}</code></pre>`
		);
	}

	return str
		.replace(/^\*\s.*$/gm, val => `<b> • </b>${val.slice(2)}`)
		.replace(/\`[^`].*\`/gm, val => `<code>${val.slice(1, val.length - 1)}</code>`)
		.replace(/\*\*(.*)\*\*/gm, "<b>$1</b>")
		.replace(/\*(.*)\*/gm, "<b>$1</b>");
};

const client = new Bot(process.env.TOKEN);

client.command("gemini", async ctx => {
	if (![654382771, 946070039].includes(ctx.chatId)) return;
	const args = ctx.msg.text.split(/\s+/).slice(1);
	if (!args.length) return ctx.reply("Не удалось найти запрос...");

	const msg = await ctx.reply("Подождите, ответ генерируется...", { reply_parameters: { message_id: ctx.msgId } });
	await ctx.replyWithChatAction("typing");

	const prompt = ctx.msg.text;
	const result = await model.generateContent(prompt);
	const response = result.response;
	const text = response.text();

	await ctx.api
		.editMessageText(msg.chat.id, msg.message_id, parser(text).slice(0, 4096), {
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
