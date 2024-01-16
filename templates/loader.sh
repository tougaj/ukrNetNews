#!/usr/bin/env bash

# Скрипт для завантаження новин та переміщення сформованого файлу в потрібний каталог.
# Для внесення змін скопіюйте даний файл в новий з назвою loader.local.sh, зробіть зміни в ньому
# та запускайте саме його. Новий файл не підпадає під контроль версій.

node dist/ptLoader.js -l -s "main kyiv politics world"

INPUT_DIR="./output"
OUTPUT_DIR="$HOME/temp"
threshold_size=100

file_name="ukrnet.json"
file_path="${INPUT_DIR}/${file_name}"

# Перевірка наявності файлу
if [ -f "$file_path" ]; then
    # Отримання розміру файлу в Кб
    file_size=$(du -k "$file_path" | cut -f1)

    # Перевірка розміру файлу
    if [ "$file_size" -gt "$threshold_size" ]; then
        # Переміщення файлу у вказаний каталог
        mv "$file_path" "$OUTPUT_DIR/"
        echo "Файл переміщено у каталог $OUTPUT_DIR"
    else
        echo "Розмір файлу менше або дорівнює $threshold_size Кб, немає необхідності переміщати."
    fi
else
    echo "Файл $file_name не знайдено в каталозі $INPUT_DIR"
fi

# При використання pm2 для створення завдання може використовуватись наступна команда
# pm2 start "node dist/ptLoader.js -l -s \"main kyiv\"" --name ukrNetLoader --restart-delay 900000 --time
