docker_build_bot:
	docker build -t mased/msdbot_ai_telegram .

docker_bot_api:
	docker run \
	--name telegram-bot-api \
	--network msdbot_internal_network \
	-p 8081:8081 \
	--env-file .env \
	-v /etc/timezone:/etc/timezone \
	-v telegram_api_data:/var/lib/telegram-bot-api \
	-d aiogram/telegram-bot-api:latest

docker_bot:
	docker run \
	--name msdbot_ai_telegram \
	--network msdbot_internal_network \
	--env-file .env \
	-e NODE_ENV=production \
	-d mased/msdbot_ai_telegram