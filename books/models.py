from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.cache import cache
import requests
import logging

logger = logging.getLogger(__name__)


class UserBook(models.Model):
    STATUS_CHOICES = [
        ('reading', 'Читаю'),
        ('want-to-read', 'В планах'),
        ('read', 'Прочитано'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book_id = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    progress = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    progress_percent = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    class Meta:
        unique_together = ('user', 'book_id')
        verbose_name = 'Книга пользователя'
        verbose_name_plural = 'Книги пользователей'

    def __str__(self):
        return f"{self.user.username} - {self.book_id} ({self.status})"

    def update_progress_percent(self, total_pages):
        """Автоматически обновляет процент прогресса на основе общего количества страниц."""
        if total_pages > 0:
            self.progress_percent = round((self.progress / total_pages) * 100)
        else:
            self.progress_percent = 0
        self.save()


class BookReview(models.Model):
    RATING_CHOICES = [
        (1, '1 - Не советую'),
        (2, '2 - Плохо'),
        (3, '3 - Нормально'),
        (4, '4 - Хорошо'),
        (5, '5 - Отлично'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    book_id = models.CharField(max_length=255)
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_reviews', blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'book_id')
        verbose_name = 'Отзыв о книге'
        verbose_name_plural = 'Отзывы о книгах'

    def __str__(self):
        return f"{self.user.username} - {self.book_id} ({self.rating}/5)"

    def get_book_title(self):
        cache_key = f"book_title_{self.book_id}"
        cached_title = cache.get(cache_key)

        if cached_title:
            return cached_title

        try:
            response = requests.get(
                f'https://www.googleapis.com/books/v1/volumes/{self.book_id}',
                timeout=10
            )
            if response.status_code == 200:
                title = response.json()['volumeInfo'].get('title', 'Без названия')
                cache.set(cache_key, title, 86400)
                return title
        except Exception as e:
            logger.error(f"Ошибка при получении данных книги: {e}")

        return 'Без названия'