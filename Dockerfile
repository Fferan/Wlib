# Этап 1: Установка зависимостей
FROM python:3.12-slim AS builder

WORKDIR /app

# Системные библиотеки для psycopg2 и Pillow
RUN apt-get update && apt-get install -y \
    libpq-dev gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Этап 2: Финальный образ
FROM python:3.12-slim

WORKDIR /app

# Копируем зависимости из первого этапа
COPY --from=builder /install /usr/local

# Копируем код проекта
COPY . .

# Собираем статику
RUN python manage.py collectstatic --noinput

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Запуск через gunicorn
CMD ["gunicorn", "mybooksite.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
