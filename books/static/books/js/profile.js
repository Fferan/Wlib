// Переключение вкладок
function switchTab(index) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    tabs[index].classList.add('active');
    contents[index].classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Обработчики удаления книг
    document.querySelectorAll('.remove-book-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const bookItem = this.closest('.profile-book-item');
            const bookList = bookItem.parentElement;
            const bookId = this.getAttribute('data-book-id');

            // Немедленно запускаем анимацию удаления
            bookItem.classList.add('book-removing');

            try {
                const response = await fetch('/remove_book/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ book_id: bookId })
                });

                const data = await response.json();

                if (data.success) {
                    // После анимации удаляем элемент из DOM
                    setTimeout(() => {
                        bookItem.remove();
                        showNotification('Книга удалена из закладок', false);

                        // Если это была последняя книга, показываем пустое состояние
                        if (bookList.querySelectorAll('.profile-book-item').length === 0) {
                            showEmptyState(bookList);
                        }

                        // Обновляем счетчики книг
                        updateBooksCounters();
                    }, 400);
                } else {
                    bookItem.classList.remove('book-removing');
                    showNotification(data.message, true);
                }
            } catch (error) {
                bookItem.classList.remove('book-removing');
                showNotification('Ошибка при удалении книги', true);
                console.error('Error:', error);
            }
        });
    });

    // Функция показа пустого состояния
    function showEmptyState(bookList) {
        const tabId = bookList.parentElement.id;
        let icon, text;

        switch(tabId) {
            case 'tab-0':
                icon = 'fa-book-open';
                text = 'Здесь пока нет прочитанных книг';
                break;
            case 'tab-1':
                icon = 'fa-book-reader';
                text = 'Вы пока не читаете ни одной книги';
                break;
            case 'tab-2':
                icon = 'fa-bookmark';
                text = 'У вас пока нет книг в планах на чтение';
                break;
        }

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas ${icon}"></i>
            ${text}
        `;

        bookList.appendChild(emptyState);
    }

    // Функция обновления счетчиков книг
    function updateBooksCounters() {
        const counters = {
            'read': document.querySelector('.tab[data-tab="read"] .counter'),
            'reading': document.querySelector('.tab[data-tab="reading"] .counter'),
            'want-to-read': document.querySelector('.tab[data-tab="want-to-read"] .counter')
        };

        fetch('/get_books_count/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    for (const [status, counter] of Object.entries(counters)) {
                        if (counter) {
                            counter.textContent = data.counts[status] || '0';
                        }
                    }
                }
            })
            .catch(error => console.error('Error updating counters:', error));
    }

    // Функция показа уведомлений
    function showNotification(message, isError = false) {
        const existingNotification = document.querySelector('.notification.show');
        if (existingNotification) {
            existingNotification.classList.remove('show');
            setTimeout(() => existingNotification.remove(), 400);
        }
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.innerHTML = `
            <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Функция получения куки
    function getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    }

    // Инициализация счетчиков при загрузке страницы
    updateBooksCounters();
});