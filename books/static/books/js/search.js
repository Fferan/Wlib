// Функция для сбора ВСЕХ книг (видимых + скрытых)
function getAllBooks() {
    const bookContainer = document.getElementById('book-container');
    const hiddenBooks = document.getElementById('hidden-books');
    return [
        ...Array.from(bookContainer.querySelectorAll('a')),
        ...Array.from(hiddenBooks.querySelectorAll('a'))
    ];
}

// Ваша оригинальная функция getTextValue (без изменений)
function getTextValue(book, keyword) {
    const textElement = [...book.querySelectorAll('.book-info p')]
        .find(p => p.textContent.includes(keyword));

    if (!textElement) {
        console.warn(`Не найдено поле "${keyword}" в`, book);
        return 0;
    }

    let value = textElement.textContent.replace(/\D/g, '');

    if (keyword === "Год выхода") {
        if (value.length >= 8) {
            return new Date(value.slice(0, 4), value.slice(4, 6) - 1, value.slice(6, 8)).getTime();
        } else if (value.length === 4) {
            return parseInt(value, 10);
        }
    }

    return parseInt(value, 10) || 0;
}

// Обновленная функция сортировки (работает со всеми книгами)
function sortBooks() {
    const sortOption = document.getElementById("sortOption").value;
    const bookContainer = document.getElementById('book-container');
    const hiddenBooks = document.getElementById('hidden-books');
    
    // 1. Получаем ВСЕ книги
    const allBooks = getAllBooks();
    
    // 2. Сортируем
    allBooks.sort((a, b) => {
        if (sortOption === "pages") {
            return getTextValue(b, "Кол-во страниц") - getTextValue(a, "Кол-во страниц");
        } else if (sortOption === "year") {
            return getTextValue(b, "Год выхода") - getTextValue(a, "Год выхода");
        }
        return 0;
    });

    // 3. Очищаем контейнеры
    bookContainer.innerHTML = '';
    hiddenBooks.innerHTML = '';
    
    // 4. Распределяем книги: первые 20 в основной контейнер, остальные в скрытый
    allBooks.forEach((book, index) => {
        if (index < 20) {
            bookContainer.appendChild(book);
        } else {
            hiddenBooks.appendChild(book);
        }
    });
    
    // 5. Обновляем интерфейс
    updateBooksCounter();
    document.getElementById('show-all').style.display = 
        hiddenBooks.children.length > 0 ? 'inline-block' : 'none';
}

// Обновленный реверс (работает со всеми книгами)
let isReversed = false;

function reverseBooks() {
    const bookContainer = document.getElementById('book-container');
    const hiddenBooks = document.getElementById('hidden-books');
    
    // 1. Получаем ВСЕ книги
    const allBooks = getAllBooks();
    
    // 2. Реверсируем
    allBooks.reverse();
    
    // 3. Очищаем контейнеры
    bookContainer.innerHTML = '';
    hiddenBooks.innerHTML = '';
    
    // 4. Распределяем обратно
    allBooks.forEach((book, index) => {
        if (index < 20) {
            bookContainer.appendChild(book);
        } else {
            hiddenBooks.appendChild(book);
        }
    });
    
    // 5. Обновляем интерфейс
    isReversed = !isReversed;
    document.querySelector('.reverse-button').classList.toggle('rotated', isReversed);
    updateBooksCounter();
    document.getElementById('show-all').style.display = 
        hiddenBooks.children.length > 0 ? 'inline-block' : 'none';
}

// Форматирование года выхода
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.book-info p').forEach(p => {
        if (p.textContent.includes("Год выхода:")) {
            let yearMatch = p.textContent.match(/\d{4}/);
            if (yearMatch) {
                p.innerHTML = `<span class="bold-text">Год выхода:</span> ${yearMatch[0]}`;
            }
        }
    });
});