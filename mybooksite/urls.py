from django.contrib import admin
from django.urls import path, include, reverse_lazy
from django.conf import settings
from django.conf.urls.static import static
from books import views
from books.views import RegisterView, update_progress, CustomLoginView
from django.contrib.auth.views import PasswordChangeView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin_panelWlib/', admin.site.urls),
    path('accounts/', include("django.contrib.auth.urls")),
    path('', views.home, name='home'),
    path('search/', views.search, name='search'),
    path('book/<str:book_id>/', views.book_detail, name='book_detail'),
    path('profile/', views.profile, name='profile'),
    path('update_book_status/', views.update_book_status, name='update_book_status'),
    path("update-progress/", update_progress, name="update_progress"),
    path('get_book_status/', views.get_book_status, name='get_book_status'),
    path('remove_book/', views.remove_book, name='remove_book'),
    path('book/<str:book_id>/add_review/', views.add_review, name='add_review'),
    path('delete_review/<int:review_id>/', views.delete_review, name='delete_review'),
    path("login/", CustomLoginView.as_view(), name="login"),
    path('logout/', views.logout_view, name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    path('change-password/', PasswordChangeView.as_view(
        template_name='registration/change_password.html',
        success_url=reverse_lazy('profile')
    ), name='password_change')
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)