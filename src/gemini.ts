import { GoogleGenerativeAI } from "@google/generative-ai";
import { Composer } from "grammy";
import type { Message } from "grammy/types";
import { parser } from "parser";
import { channelID, type GeminiContext, userIDs } from "./utils";

export const gemini = new Composer();
const context: Record<number, GeminiContext[]> = {};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

gemini
	.filter(({ from }) => from !== null && userIDs.includes(from!.id))
	.filter(({ msg }) => msg?.text?.split(/\s+/).length! > 1)
	.hears(/@masedmsd_ai_bot/gm, async ctx => {
		await ctx.replyWithChatAction("typing");
		const args = ctx.msg.text!.split(/\s+/);

		const { chat, message_id } = await ctx.reply("Подождите, ответ генерируется...");

		const userContext = context[ctx.from!.id];
		if (!userContext) context[ctx.from!.id] = [];

		const GPTchat = model.startChat({ history: userContext });
		const GPTMessage = await GPTchat.sendMessage(args.join(" ").replaceAll("@masedmsd_ai_bot", ""));

		const { response } = GPTMessage;
		const str = parser(response.text()).slice(0, 4090);

		context[ctx.from!.id]!.push({ role: "user", parts: [{ text: args.join(" ") }] });
		context[ctx.from!.id]!.push({ role: "model", parts: [{ text: response.text() }] });
		context[ctx.from!.id]!.slice(context[ctx.from!.id]!.length - 10, context[ctx.from!.id]!.length);

		return ctx.api.editMessageText(chat.id, message_id, str, { parse_mode: "HTML" }).catch(err => {
			ctx.api.editMessageText(
				chat.id,
				message_id,
				"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram",
				{ parse_mode: "HTML" }
			);

			console.log(err);
		});
	});

gemini.command("clear_context", async ctx => {
	context[ctx.from?.id!] = [];

	await ctx.answerCallbackQuery({ text: "Контекст успешно очищен!" });
	await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
});

gemini
	.filter(({ from }) => from !== null && userIDs.includes(from!.id))
	.filter(({ msg }) => msg?.text?.split(/\s+/).length! > 1)
	.command("gemini", async ctx => {
		await ctx.replyWithChatAction("typing");
		const args = ctx.msg.text!.split(/\s+/);

		const { chat, message_id } = await ctx.reply("Подождите, ответ генерируется...");

		const userContext = context[ctx.from!.id];
		if (!userContext) context[ctx.from!.id] = [];

		const GPTchat = model.startChat({ history: userContext });
		const GPTMessage = await GPTchat.sendMessage(args.join(" ").replaceAll("@masedmsd_ai_bot", ""));

		const { response } = GPTMessage;
		const str = parser(response.text()).slice(0, 4090);

		context[ctx.from!.id]!.push({ role: "user", parts: [{ text: args.join(" ") }] });
		context[ctx.from!.id]!.push({ role: "model", parts: [{ text: response.text() }] });
		context[ctx.from!.id]!.slice(context[ctx.from!.id]!.length - 10, context[ctx.from!.id]!.length);

		return ctx.api.editMessageText(chat.id, message_id, str, { parse_mode: "HTML" }).catch(err => {
			ctx.api.editMessageText(
				chat.id,
				message_id,
				"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram",
				{ parse_mode: "HTML" }
			);

			console.log(err);
		});
	});

gemini.callbackQuery(/clear_context_(\d+)/gm, async ctx => {
	const id = Number(ctx.callbackQuery.data.slice("clear_context_".length));
	if (ctx.callbackQuery.from.id !== id) return;

	context[id] = [];
	await ctx.answerCallbackQuery({ text: "Контекст успешно очищен!" });
	await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
});

gemini.on("message", async ctx => {
	if (!ctx.message.forward_origin || (ctx.message?.forward_origin! as Message)?.chat?.id !== channelID) return;

	await ctx.replyWithChatAction("typing");

	const text = ctx.message.text || ctx.message.caption;
	if (!text) return;

	const prompt =
		"Подготовь саммари представленного ниже поста Telegram. Объем саммари не должен превышать 8-10 предложений.\n\n" +
		text;

	const { response } = await model.generateContent({ contents: [{ parts: [{ text: prompt }], role: "user" }] });
	const responseText = response.text();

	return ctx.reply(parser(responseText).slice(0, 4090), { parse_mode: "HTML" });
});
