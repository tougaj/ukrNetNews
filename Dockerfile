# Базовий образ
FROM node:20-slim

# Встановлення необхідних пакетів для Puppeteer і Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libpango-1.0-0 \
    libxshmfence1 \
    xdg-utils \
    fonts-liberation \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Встановлення робочої директорії
WORKDIR /app

# Копіюємо файли
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо ваш скрипт
COPY ./dist .

# Встановлюємо змінні середовища для Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Встановлюємо аргумент для скрипта
# ARG SECTIONS="-b -i -s 'some string parameters'"

# Передаємо значення ARG у ENV
ENV SECTIONS=""

# Команда запуску контейнера
CMD ["bash", "-c", "while true; do node ptLoader.js -lb -s \"$SECTIONS\"; sleep 300; done"]
# CMD ["bash", "-c", "while true; do node ptLoader.js -lb -s \"main politics\"; sleep 300; done"]
# CMD ["bash", "-c", "node ptLoader.js $SECTIONS"]
