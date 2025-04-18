import { GoogleGenerativeAI } from "@google/generative-ai";
import { Composer } from "grammy";
import type { Message } from "grammy/types";
import { parser } from "parser";
import { channelID, type GeminiContext, userIDs } from "./utils";

export const gemini = new Composer();
const inlineQueryContext: Record<number, string> = {};
const context: Record<number, GeminiContext[]> = {};

const maxMessageLength = 2048 as const;
const lengthError =
	"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram" as const;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

gemini.inlineQuery(/(.*)/gm, async ctx => {
	if (ctx.inlineQuery.from.id !== 946070039) return ctx.answerInlineQuery([]);

	inlineQueryContext[ctx.inlineQuery.from.id] = ctx.inlineQuery.query;

	return ctx.answerInlineQuery(
		[
			{
				id: "gemini",
				type: "article",
				title: "Gemini AI",
				description: "Спроси меня о чём-либо!",
				input_message_content: {
					message_text: [
						`⌛ Подождите, ответ генерируется...`,
						`<b>Запрос:</b>\n<blockquote>${ctx.inlineQuery.query}</blockquote>`,
					].join("\n\n"),
					parse_mode: "HTML",
				},
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: "Генерирую... (Нажимайте в чатах)",
								callback_data: "generate",
							},
						],
					],
				},
			},
		],
		{ cache_time: 0 }
	);
});

gemini.chosenInlineResult("gemini", async ctx => {
	const { response } = await model.generateContent({
		contents: [{ parts: [{ text: ctx.chosenInlineResult.query }], role: "user" }],
	});
	const responseText = response.text();
	const str =
		parser(responseText).length > maxMessageLength - 8
			? parser(responseText).slice(0, maxMessageLength - 8) + "..."
			: parser(responseText);

	return ctx.editMessageText(str, { parse_mode: "HTML" }).catch(err => {
		ctx.editMessageText(lengthError);

		console.log(err);
	});
});

gemini.callbackQuery("generate", async ctx => {
	const query = inlineQueryContext[ctx.callbackQuery.from.id];
	if (!query)
		return ctx.answerCallbackQuery({
			text: "Произошла ошибка, возможно кнопка предназначена не вам!",
			show_alert: true,
		});

	await ctx.answerCallbackQuery({ text: "Генерирую...", show_alert: true });

	const { response } = await model.generateContent({ contents: [{ parts: [{ text: query }], role: "user" }] });
	const responseText = response.text();
	const str =
		parser(responseText).length > maxMessageLength - 8
			? parser(responseText).slice(0, maxMessageLength - 8) + "..."
			: parser(responseText);

	delete inlineQueryContext[ctx.callbackQuery.from.id];

	return ctx.editMessageText(str, { parse_mode: "HTML" }).catch(err => {
		ctx.editMessageText(lengthError);

		console.log(err);
	});
});

gemini.on("inline_query", ctx => ctx.answerInlineQuery([]));

gemini
	.filter(({ from }) => from !== undefined && userIDs.includes(from!.id))
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
		const str =
			parser(response.text()).length > maxMessageLength - 8
				? parser(response.text()).slice(0, maxMessageLength - 8) + "..."
				: parser(response.text());

		context[ctx.from!.id]!.push({ role: "user", parts: [{ text: args.join(" ") }] });
		context[ctx.from!.id]!.push({ role: "model", parts: [{ text: response.text() }] });
		context[ctx.from!.id]!.slice(context[ctx.from!.id]!.length - 10, context[ctx.from!.id]!.length);

		return ctx.api.editMessageText(chat.id, message_id, str, { parse_mode: "HTML" }).catch(err => {
			ctx.api.editMessageText(chat.id, message_id, lengthError, { parse_mode: "HTML" });

			console.log(err);
		});
	});

gemini.command("clear_context", async ctx => {
	delete context[ctx.from?.id!];

	await ctx.answerCallbackQuery({ text: "Контекст успешно очищен!" });
	return ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
});

gemini
	.filter(({ from }) => from !== undefined && userIDs.includes(from!.id))
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
		const str =
			parser(response.text()).length > maxMessageLength - 8
				? parser(response.text()).slice(0, maxMessageLength - 8) + "..."
				: parser(response.text());

		context[ctx.from!.id]!.push({ role: "user", parts: [{ text: args.join(" ") }] });
		context[ctx.from!.id]!.push({ role: "model", parts: [{ text: response.text() }] });
		context[ctx.from!.id]!.slice(context[ctx.from!.id]!.length - 10, context[ctx.from!.id]!.length);

		return ctx.api.editMessageText(chat.id, message_id, str, { parse_mode: "HTML" }).catch(err => {
			ctx.api.editMessageText(chat.id, message_id, lengthError, { parse_mode: "HTML" });

			console.log(err);
		});
	});

gemini.callbackQuery(/clear_context_(\d+)/gm, async ctx => {
	const id = Number(ctx.callbackQuery.data.slice("clear_context_".length));
	if (ctx.callbackQuery.from.id !== id) return;

	delete context[id];
	await ctx.answerCallbackQuery({ text: "Контекст успешно очищен!" });
	return ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
});

gemini.on("message", async (ctx, next) => {
	await next();
	if (!ctx.message.forward_origin || (ctx.message?.forward_origin! as Message)?.chat?.id !== channelID) return;

	await ctx.replyWithChatAction("typing");

	const text = ctx.message.text || ctx.message.caption;
	if (!text) return;

	const prompt =
		"Подготовь саммари представленного ниже поста Telegram. Объем саммари не должен превышать 8-10 предложений.\n\n" +
		text;

	const { response } = await model.generateContent({ contents: [{ parts: [{ text: prompt }], role: "user" }] });
	const str =
		parser(response.text()).length > maxMessageLength - 8
			? parser(response.text()).slice(0, maxMessageLength - 8) + "..."
			: parser(response.text());

	return ctx.reply(str, { parse_mode: "HTML" });
});
