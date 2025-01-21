Лог-файли знаходяться в каталозі `/var/lib/docker/containers`

Для того, щоб лог-файли не росли безконтрольно необхідно створити в каталозі `/etc/docker` файл з назвою `daemon.json` з наступним вмістом:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

і після цього перезапустити докер:

```bash
sudo systemctl restart docker
```

Переконатися, що налаштування застосовані, можна за допомогою команди:

```bash
docker info | grep -i 'logging driver'
```

Також необхідно перезапустити через `docker run...` всі контейнери, щоб вони підхопили нову політику.

Перевірити конфігурацію логування можна за допомогою команд:

```bash
docker inspect <container_name_or_id> | less # Тут треба шукати параметр LogConfig
```