import json
import logging
import csv
from pathlib import Path
from django.shortcuts import render, redirect
from django.contrib.auth import logout, authenticate, login
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse, Http404
from django.urls import reverse_lazy
from django.views.generic.edit import FormView
from django.contrib import messages
from django.db.models import Avg
from django.conf import settings
from django.contrib.auth.views import LoginView
from django.core.exceptions import PermissionDenied
from .forms import RegisterForm
from .models import UserBook, BookReview

logger = logging.getLogger(__name__)

BOOKS_CSV_PATH = Path(settings.BASE_DIR) / 'books/data/books_import.csv'
DEFAULT_BOOK_COVER = '/static/books/images/default_book_cover.jpg'


def load_books_data():
    books = []
    try:
        with open(BOOKS_CSV_PATH, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                rating = row['rating'].replace(',', '.') if row['rating'] else None
                books.append({
                    'id': row['isbn_13'],
                    'title': row['title'],
                    'authors': row['authors'],
                    'publisher': row['publisher'],
                    'published_date': row['published_date'],
                    'page_count': int(row['page_count']) if row['page_count'] else 0,
                    'description': row['description'],
                    'genres': row['genres'],
                    'thumbnail': row['thumbnail_url'],
                    'isbn_13': row['isbn_13'],
                    'language': row['language'],
                    'rating': float(rating) if rating else None,
                })
    except Exception as e:
        logger.error(f"Error loading book data: {e}")
    return books


ALL_BOOKS = load_books_data()


def get_books_by_genre(genre, max_results=40):
    books = []
    for book in ALL_BOOKS:
        if genre.lower() in book['genres'].lower():
            books.append({
                'id': book['isbn_13'],
                'title': book['title'],
                'authors': book['authors'],
                'publisher': book['publisher'],
                'page_count': book['page_count'],
                'published_date': book['published_date'],
                'thumbnail': book['thumbnail'] or DEFAULT_BOOK_COVER,
            })
            if len(books) >= max_results:
                break
    return books


def home(request):
    context = {
        'fantasy_books': get_books_by_genre('Фантастика'),
        'detective_books': get_books_by_genre('Детектив'),
        'manga_books': get_books_by_genre('Манга'),
        'romance_books': get_books_by_genre('Романтика'),
    }
    return render(request, 'books/home.html', context)


def search(request):
    query = request.GET.get('q', '').strip().lower()
    if not query:
        return redirect('home')

    books = []
    for book in ALL_BOOKS:
        if (query in book['title'].lower() or
                query in book['authors'].lower() or
                query in book['publisher'].lower() or
                query in book['description'].lower()):
            books.append({
                'id': book['isbn_13'],
                'title': book['title'],
                'authors': book['authors'],
                'publisher': book['publisher'],
                'page_count': book['page_count'],
                'published_date': book['published_date'],
                'thumbnail': book['thumbnail'] or DEFAULT_BOOK_COVER,
            })

    return render(request, 'books/search.html', {
        'books': books,
        'query': query,
        'total_books': len(books)
    })


def book_detail(request, book_id):
    book_data = None
    for book in ALL_BOOKS:
        if book['isbn_13'] == book_id:
            book_data = {
                'id': book['isbn_13'],
                'title': book['title'],
                'authors': book['authors'],
                'publisher': book['publisher'],
                'page_count': book['page_count'],
                'published_date': book['published_date'],
                'thumbnail': book['thumbnail'] or DEFAULT_BOOK_COVER,
                'description': book['description'],
                'language': book['language'],
                'rating': book['rating'],
                'rating_count': 0,  # У нас нет данных о количестве оценок
                'genre': book['genres'],
                'isbn': book['isbn_13'],
                'is_readable_online': False,  # Нет информации о доступности онлайн
            }
            break

    if not book_data:
        raise Http404("Книга не найдена")

    user_book_data = {
        'has_book': False,
        'status': '',
        'progress': 0,
        'progress_percent': 0
    }

    if request.user.is_authenticated:
        try:
            user_books = UserBook.objects.filter(user=request.user, book_id=book_id).order_by('-updated_at')
            if user_books.exists():
                user_book = user_books.first()
                user_book_data = {
                    'has_book': True,
                    'status': user_book.status,
                    'progress': user_book.progress,
                    'progress_percent': user_book.progress_percent
                }
                if user_books.count() > 1:
                    user_books.exclude(pk=user_book.pk).delete()
                    logger.warning(f"Удалены дубликаты книги {book_id} для пользователя {request.user.username}")
        except Exception as e:
            logger.error(f"Ошибка при получении данных пользователя о книге {book_id}: {e}")

    reviews = BookReview.objects.filter(book_id=book_id).select_related('user').order_by('-created_at')
    total_reviews = reviews.count()
    average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0

    rating_bars = []
    for stars in ['5', '4', '3', '2', '1']:
        count = reviews.filter(rating=int(stars)).count()
        percent = (count / total_reviews * 100) if total_reviews > 0 else 0
        rating_bars.append({
            'stars': stars,
            'count': count,
            'percent': round(percent, 1)
        })

    user_review = None
    if request.user.is_authenticated:
        user_review = BookReview.objects.filter(
            user=request.user,
            book_id=book_id
        ).first()

    context = {
        'book': book_data,
        'user_book': user_book_data,
        'is_authenticated': request.user.is_authenticated,
        'reviews': reviews[:10],
        'rating_bars': rating_bars,
        'total_reviews': total_reviews,
        'average_rating': round(average_rating, 1) if average_rating else 0,
        'user_review': user_review,
        'user_has_reviewed': user_review is not None,
        'reviews_exist': total_reviews > 0,
    }

    return render(request, 'books/book_detail.html', context)

@login_required
@csrf_protect
def add_review(request, book_id):
    if request.method != 'POST':
        return redirect('home')

    rating = request.POST.get('rating')
    text = request.POST.get('text', '').strip()

    if not rating:
        messages.error(request, 'Необходимо указать рейтинг')
        return redirect('book_detail', book_id=book_id)

    if not text:
        messages.error(request, 'Текст отзыва не может быть пустым')
        return redirect('book_detail', book_id=book_id)

    if len(text) > 1000:
        messages.error(request, 'Текст отзыва не может превышать 1000 символов')
        return redirect('book_detail', book_id=book_id)

    try:
        BookReview.objects.update_or_create(
            user=request.user,
            book_id=book_id,
            defaults={'rating': rating, 'text': text}
        )
        messages.success(request, 'Ваш отзыв успешно сохранен!')
    except Exception as e:
        logger.error(f"Ошибка при сохранении отзыва: {e}")
        messages.error(request, 'Произошла ошибка при сохранении отзыва')

    return redirect('book_detail', book_id=book_id)


class RegisterView(FormView):
    template_name = 'books/register.html'
    form_class = RegisterForm
    success_url = reverse_lazy('home')

    def form_valid(self, form):
        user = form.save()
        username = form.cleaned_data.get('username')
        raw_password = form.cleaned_data.get('password1')
        user = authenticate(self.request, username=username, password=raw_password)

        if user is not None:
            login(self.request, user)

        return super().form_valid(form)

def update_progress(request):
    if request.method != "POST":
        return JsonResponse({
            "status": "error",
            "message": "Неверный метод запроса"
        }, status=405)

    try:
        data = json.loads(request.body)
        book_id = data.get("book_id")
        progress = data.get("progress")
        progress_percent = data.get('progress_percent', 0)

        if not book_id or progress is None:
            return JsonResponse({
                "status": "error",
                "message": "Недостаточно данных"
            }, status=400)

        user_book = UserBook.objects.get(user=request.user, book_id=book_id)
        user_book.progress = progress
        user_book.progress_percent = progress_percent

        if progress_percent >= 100:
            user_book.status = 'read'
        elif user_book.status == 'read' and progress_percent < 100:
            user_book.status = 'reading'

        user_book.save()
        user_book.refresh_from_db()

        return JsonResponse({
            "status": "success",
            "progress": progress,
            "progress_percent": progress_percent,
            "current_status": user_book.status
        })

    except UserBook.DoesNotExist:
        return JsonResponse({
            "status": "error",
            "message": "Книга не найдена в вашем списке"
        }, status=404)
    except Exception as e:
        logger.error(f"Ошибка при обновлении прогресса: {e}")
        return JsonResponse({
            "status": "error",
            "message": "Внутренняя ошибка сервера"
        }, status=500)

def update_book_status(request):
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Неверный метод запроса'
        }, status=405)

    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        status = data.get('status')
        progress = data.get('progress', 0)
        progress_percent = data.get('progress_percent', 0)

        if not book_id or not status:
            return JsonResponse({
                'success': False,
                'message': 'Недостаточно данных'
            }, status=400)

        UserBook.objects.update_or_create(
            user=request.user,
            book_id=book_id,
            defaults={
                'status': status,
                'progress': progress,
                'progress_percent': progress_percent
            }
        )

        return JsonResponse({
            'success': True,
            'message': 'Статус обновлен'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Неверный формат данных'
        }, status=400)
    except Exception as e:
        logger.error(f"Ошибка при обновлении статуса книги: {e}")
        return JsonResponse({
            'success': False,
            'message': 'Внутренняя ошибка сервера'
        }, status=500)

def remove_book(request):
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Неверный метод запроса'
        }, status=405)

    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')

        if not book_id:
            return JsonResponse({
                'success': False,
                'message': 'Не указан ID книги'
            }, status=400)

        deleted_count, _ = UserBook.objects.filter(
            user=request.user,
            book_id=book_id
        ).delete()

        if deleted_count > 0:
            return JsonResponse({
                'success': True,
                'message': 'Книга удалена из профиля'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Книга не найдена в вашем профиле'
            }, status=404)

    except Exception as e:
        logger.error(f"Ошибка при удалении книги: {e}")
        return JsonResponse({
            'success': False,
            'message': 'Ошибка при удалении'
        }, status=500)


def get_book_status(request):
    book_id = request.GET.get('book_id')
    if not book_id:
        return JsonResponse({'exists': False})

    try:
        user_book = UserBook.objects.get(user=request.user, book_id=book_id)
        return JsonResponse({
            'exists': True,
            'status': user_book.status,
            'progress': user_book.progress,
            'progress_percent': user_book.progress_percent
        })
    except UserBook.DoesNotExist:
        return JsonResponse({'exists': False})

def get_books_count(request):
    try:
        counts = {
            'read': UserBook.objects.filter(user=request.user, status='read').count(),
            'reading': UserBook.objects.filter(user=request.user, status='reading').count(),
            'want-to-read': UserBook.objects.filter(user=request.user, status='want-to-read').count(),
        }
        return JsonResponse({
            'success': True,
            'counts': counts
        })
    except Exception as e:
        logger.error(f"Error getting books count: {e}")
        return JsonResponse({
            'success': False,
            'message': 'Ошибка при получении количества книг'
        }, status=500)

def profile(request):
    user_books = UserBook.objects.filter(user=request.user)
    books_data = []

    for user_book in user_books:
        for book in ALL_BOOKS:
            if book['isbn_13'] == user_book.book_id:
                books_data.append({
                    'id': book['isbn_13'],
                    'title': book['title'],
                    'authors': book['authors'],
                    'thumbnail': book['thumbnail'] or DEFAULT_BOOK_COVER,
                    'status': user_book.status,
                    'progress': user_book.progress,
                    'progress_percent': user_book.progress_percent,
                    'page_count': book['page_count'],
                })
                break

    books_by_status = {
        'read_books': [b for b in books_data if b['status'] == 'read'],
        'reading_books': [b for b in books_data if b['status'] == 'reading'],
        'want_to_read_books': [b for b in books_data if b['status'] == 'want-to-read'],
    }

    return render(request, 'books/profile.html', books_by_status)


def logout_view(request):
    logout(request)
    return redirect('home')

def delete_review(request, review_id):
    try:
        review = BookReview.objects.get(id=review_id, user=request.user)
        review.delete()
        return JsonResponse({'success': True, 'message': 'Отзыв успешно удален'})
    except BookReview.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Отзыв не найден'}, status=404)
    except Exception as e:
        logger.error(f"Ошибка при удалении отзыва: {e}")
        return JsonResponse({'success': False, 'message': 'Ошибка при удалении отзыва'}, status=500)
    

class CustomLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except PermissionDenied:
            messages.error(request, "Вы заблокированы на 10 минут из-за слишком большого количества неудачных попыток входа.")
            return redirect('login')  # Название URL-шаблона логина