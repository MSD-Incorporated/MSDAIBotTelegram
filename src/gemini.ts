import { GoogleGenerativeAI } from "@google/generative-ai";
import { Composer } from "grammy";
import { Message } from "grammy/types";
import { parser } from "parser";
import { userIDs } from "./constants";

export const gemini = new Composer();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const context: Record<number, { role: "model" | "user"; parts: { text: string }[] }[]> = {};
const channelID = -1002118873453;

gemini.hears(/@masedmsd_ai_bot/gm, async ctx => {
	if (!userIDs.includes(ctx.from!.id)) return;

	const args = ctx.msg.text!.split(/\s+/);
	if (!args.length) return ctx.reply("Не удалось найти запрос...");

	await ctx.replyWithChatAction("typing");
	return ctx
		.reply("Подождите, ответ генерируется...", {
			reply_parameters: { message_id: ctx.msgId },
		})
		.then(async ({ chat, message_id }) => {
			if (!context[ctx.from!.id]) context[ctx.from!.id] = [];
			const GPTchat = model.startChat({ history: context[ctx.from!.id] });

			GPTchat.sendMessage(args.join(" ").replaceAll("@masedmsd_ai_bot", ""))
				.then(async ({ response }) => {
					const text = response.text();
					const str = parser(text).slice(0, 4090);

					context[ctx.from!.id]!.push({ role: "user", parts: [{ text: args.join(" ") }] });
					context[ctx.from!.id]!.push({ role: "model", parts: [{ text }] });
					context[ctx.from!.id]!.slice(context[ctx.from!.id]!.length - 10, context[ctx.from!.id]!.length);

					return ctx.api
						.editMessageText(chat.id, message_id, str, {
							parse_mode: "HTML",
						})
						.catch(err => {
							ctx.api.editMessageText(
								chat.id,
								message_id,
								"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram"
							);
							console.error(err);
						});
				})
				.catch(err => {
					ctx.api.editMessageText(chat.id, message_id, "Произошла неизвестная ошибка", {});
					console.error(err);
				});
		})
		.catch(err => {
			console.error(err);
		});
});

gemini.command("clear_context", async ctx => {
	const id = ctx.from?.id!;
	7;

	context[id] = [];
	await ctx.answerCallbackQuery({ text: "Контекст успешно очищен!" });
	await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
});

gemini.command("gemini", async ctx => {
	if (!userIDs.includes(ctx.from!.id)) return;

	const args = ctx.msg.text.split(/\s+/).slice(1);
	if (!args.length) return ctx.reply("Не удалось найти запрос...");

	await ctx.replyWithChatAction("typing");
	return ctx
		.reply("Подождите, ответ генерируется...", {
			reply_parameters: { message_id: ctx.msgId },
			reply_markup: {
				inline_keyboard: [[{ text: "Очистить контекст", callback_data: `clear_context_${ctx.from!.id}` }]],
			},
		})
		.then(async ({ chat, message_id }) => {
			if (!context[ctx.from!.id]) context[ctx.from!.id] = [];
			const GPTchat = model.startChat({ history: context[ctx.from!.id] });

			GPTchat.sendMessage(args.join(" "))
				.then(async ({ response }) => {
					const text = response.text();
					const str = parser(text).slice(0, 4090);

					context[ctx.from!.id]!.push({ role: "user", parts: [{ text: args.join(" ") }] });
					context[ctx.from!.id]!.push({ role: "model", parts: [{ text }] });
					context[ctx.from!.id]!.slice(context[ctx.from!.id]!.length - 10, context[ctx.from!.id]!.length);

					return ctx.api
						.editMessageText(chat.id, message_id, str, {
							parse_mode: "HTML",
						})
						.catch(err => {
							ctx.api.editMessageText(
								chat.id,
								message_id,
								"Произошла неизвестная ошибка. Возможно потому что ответ нейросети был больше, чем лимиты на длину сообщения в Telegram"
							);
							console.error(err);
						});
				})
				.catch(err => {
					ctx.api.editMessageText(chat.id, message_id, "Произошла неизвестная ошибка", {});
					console.error(err);
				});
		})
		.catch(err => {
			console.error(err);
		});
});

gemini.callbackQuery(/clear_context_(\d+)/gm, async ctx => {
	const id = Number(ctx.callbackQuery.data.slice("clear_context_".length));
	if (ctx.callbackQuery.from.id !== id) return;

	context[id] = [];
	await ctx.answerCallbackQuery({ text: "Контекст успешно очищен!" });
	await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
});

gemini.on("message", async (ctx, next) => {
	await next();
	console.log(1235);

	if (!ctx.message.forward_origin || (ctx.message?.forward_origin! as Message)?.chat?.id !== channelID) return;
	console.log(1234);

	const text = ctx.message.text || ctx.message.caption;
	if (!text) return;

	const prompt =
		"Подготовь саммари представленного ниже поста Telegram. Объем саммари не должен превышать 8-10 предложений.\n\n" +
		text;

	await ctx.replyWithChatAction("typing");

	const { response } = await model.generateContent({ contents: [{ parts: [{ text: prompt }], role: "user" }] });
	const responseText = response.text();

	return ctx.reply(parser(responseText).slice(0, 4090), {
		parse_mode: "HTML",
	});
});
