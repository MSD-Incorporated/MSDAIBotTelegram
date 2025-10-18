ARG BUN_VERSION="latest"
ARG ALPINE_VERSION="3.18"

# Bun Image
FROM oven/bun:${BUN_VERSION} AS bun_image
FROM frolvlad/alpine-glibc AS base_image

# Build app
FROM base_image AS build
ARG GIT_COMMIT

COPY ./src ./src
COPY package.json bun.lock ./
COPY --from=bun_image /usr/local/bin/bun /usr/local/bin/

ENV NODE_ENV=production

RUN echo "Building with GIT_COMMIT=${GIT_COMMIT}"

RUN --mount=type=cache,target=/root/.cache bun install --frozen-lockfile --production --no-cache
RUN bun run build --define GIT_COMMIT="\"${GIT_COMMIT}\""

# App
FROM base_image AS app
WORKDIR /app

COPY --from=build /dist /app

CMD [ "./msdbot_ai_telegram" ]