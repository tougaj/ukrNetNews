#!/usr/bin/env bash

# Даний скрипт має запускатись в будь-якому порожньому каталозі,
# в якому буде працювати контейнер.

# Тут обов'язково створюємо каталоги, які будуть монтуватись в контейнері
mkdir -p output

# Запуск для тестування
docker run \
	--rm \
	-it \
	-v $(pwd)/output/:/app/output:z \
	-e SECTIONS="main russianaggression politics" \
	-e TIMEOUT=10 \
	ukrnet_loader

# Запуск для роботи

# docker run -d \
# 	--name ukrnet_loader \
# 	-v $(pwd)/output/:/app/output:z \
# 	--restart unless-stopped \
#   --log-driver none \
# 	ukrnet_loader

#	-e TIMEOUT=900 \
# 	-e SECTIONS="main russianaggression politics economics criminal society world kyiv dnipro donetsk zaporizhzhya luhansk mikolayiv odesa kharkiv kherson crimea" \

# Якщо не потрібно логування, то можна використати:
#   --log-driver none \

# Якщо Вам потрібно, щоб цей контейнер автоматично запускався завжди,
# додайте до команди запуску "--restart always", або  "--restart unless-stopped"
# 
# З довідки (https://docs.docker.com/engine/containers/start-containers-automatically/):
# always        	Always restart the container if it stops. If it's manually stopped, 
#                   it's restarted only when Docker daemon restarts or the container itself
#                   is manually restarted. (See the second bullet listed in restart policy details)
# unless-stopped	Similar to always, except that when the container is stopped 
#                   (manually or otherwise), it isn't restarted even after Docker daemon restarts.

# Якщо Ви використовуєте "--name ukrnet_loader", то в подальшому запускати контейнер
# можна за допомогою команди:
# docker start ukrnet_loader
#
# Видалити контейнер можна командою:
# docker rm ukrnet_loader
#
# Переглянути список всіх контейнерів можнна командою:
# docker ps -a

# Для зупинка даного контейнера використовуйте наступну команду:
# docker stop ukrnet_loader

