document.addEventListener("DOMContentLoaded", function () {
    console.log("Book detail script loaded.");

    // --- Инициализация цветовой схемы ---
    function getDominantColor(imageElement) {
        return new Promise((resolve, reject) => {
            try {
                const colorThief = new ColorThief();
                if (imageElement.complete) {
                    const color = colorThief.getColor(imageElement);
                    resolve(color);
                } else {
                    imageElement.addEventListener('load', function() {
                        const color = colorThief.getColor(imageElement);
                        resolve(color);
                    });
                    imageElement.addEventListener('error', function() {
                        reject(new Error('Image load error'));
                    });
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    function applyColorTheme(dominantColor) {
        if (!dominantColor || dominantColor.length !== 3) {
            console.error('Invalid color:', dominantColor);
            applyDefaultColors();
            return;
        }

        const [r, g, b] = dominantColor;
        const bgColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
        const mainColor = `rgb(${r}, ${g}, ${b})`;
        const mainColorLight = `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`;

        const pageBackground = document.getElementById('page-background');
        if (pageBackground) {
            pageBackground.style.backgroundColor = bgColor;
            console.log('Background color updated:', bgColor);
        }

        document.documentElement.style.setProperty('--main-color', mainColor);
        document.documentElement.style.setProperty('--main-color-light', mainColorLight);
    }

    function applyDefaultColors() {
        document.documentElement.style.setProperty('--main-color', '#C71585');
        document.documentElement.style.setProperty('--main-color-light', '#e0409f');
        const pageBackground = document.getElementById('page-background');
        if (pageBackground) {
            pageBackground.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }
    }

    const bookCover = document.getElementById('book-cover');
    if (bookCover) {
        if (typeof ColorThief !== 'undefined') {
            getDominantColor(bookCover)
                .then(applyColorTheme)
                .catch(error => {
                    console.error('Error processing image color:', error);
                    applyDefaultColors();
                });
        } else {
            console.error('ColorThief not loaded');
            applyDefaultColors();
        }
    }

    // --- Базовые элементы и проверка ---
    const container = document.querySelector(".container");
    if (!container) {
        console.error("Container element not found. Script stopped.");
        return;
    }
    const isAuthenticated = container.getAttribute("data-is-authenticated") === "true";
    const bookId = container.getAttribute("data-book-id");
    const csrfTokenInput = document.querySelector("[name=csrfmiddlewaretoken]");
    let hasBookInCollection = false;
    let isProgressChanged = false;
    let currentBookStatus = "";
    console.log(`User Authenticated: ${isAuthenticated}, Book ID: ${bookId}`);

    if (!csrfTokenInput && isAuthenticated) {
        console.warn("CSRF token input field not found. Status/Progress updates might fail.");
    }

    // --- Скрытие/Показ элементов для авторизованных ---
    const authRequiredElements = document.querySelectorAll(".book-status-container, .reading-progress");
    if (!isAuthenticated) {
        console.log("User is not authenticated. Hiding progress and status controls.");
        authRequiredElements.forEach(el => { if (el) el.style.display = "none"; });
    } else {
        authRequiredElements.forEach(el => {
            if (el && el.style.display === 'none') el.style.display = '';
        });
    }

    // --- Инициализация элементов управления ---
    let statusMainButton, statusMainText, statusButtons, progressSlider, sliderTooltip,
        decreaseBtn, increaseBtn, pageInput, updatePagesBtn, currentPageEl, totalPagesEl,
        progressFill, progressText, bookDescription;
    let totalPages = 1;

    if (isAuthenticated) {
        // Инициализация элементов
        statusMainButton = document.getElementById("status-main-button");
        statusMainText = document.getElementById("status-main-text");
        statusButtons = document.getElementById("status-buttons");
        progressSlider = document.getElementById("progress-slider");
        sliderTooltip = document.getElementById("slider-tooltip");
        decreaseBtn = document.getElementById("decrease-btn");
        increaseBtn = document.getElementById("increase-btn");
        pageInput = document.getElementById("page-input");
        updatePagesBtn = document.getElementById("update-pages");
        currentPageEl = document.getElementById("current-page");
        totalPagesEl = document.getElementById("total-pages");
        progressFill = document.getElementById("progress-fill");
        progressText = document.getElementById("progress-text");

        if (!statusMainButton || !currentPageEl || !totalPagesEl || !progressFill || !progressText) {
            console.error("Required authenticated user elements not found.");
        }

        totalPages = totalPagesEl ? parseInt(totalPagesEl.textContent, 10) || 0 : 0;
        const progressSection = document.querySelector(".reading-progress");

        if (totalPages <= 0 && progressSection) {
            console.log("Total pages is 0 or less. Hiding progress section.");
            if (progressSection) progressSection.style.display = 'none';
            totalPages = 1;
        } else {
            console.log(`Total pages for progress: ${totalPages}`);
            if (progressSlider) {
                initSlider();
                progressSlider.addEventListener("input", handleSliderInput);
                progressSlider.addEventListener("change", handleSliderChange);
            } else {
                console.warn("Progress slider element not found.");
            }
            loadBookData();
        }

        // Обработчики событий
        if (statusMainButton && statusButtons) {
            statusMainButton.addEventListener("click", function (e) {
                e.stopPropagation();
                const isOpen = statusButtons.style.display === "flex";
                statusButtons.style.display = isOpen ? "none" : "flex";
                statusMainButton.classList.toggle('open', !isOpen);
                console.log('Status dropdown toggled');
            });

            document.addEventListener("click", function (e) {
                if (statusButtons.style.display === "flex" && !statusMainButton.contains(e.target) && !statusButtons.contains(e.target)) {
                    statusButtons.style.display = "none";
                    statusMainButton.classList.remove('open');
                    console.log('Status dropdown closed by clicking outside');
                }
            });

            document.querySelectorAll(".status-btn").forEach(button => {
                button.addEventListener("click", function (e) {
                    e.stopPropagation();
                    const status = this.getAttribute("data-status");
                    console.log(`Status button clicked: ${status}`);
                    if (status) {
                        updateBookStatus(status);
                        statusButtons.style.display = "none";
                        statusMainButton.classList.remove('open');
                        if (status === "read" && totalPages > 0) {
                            console.log('Status set to "read", updating progress to max.');
                            if (progressSlider) progressSlider.value = totalPages;
                            updateProgress(totalPages, true);
                            createSparkles(progressFill);
                        }
                    } else {
                        console.error("Status button clicked, data-status attribute missing.");
                    }
                });
            });
        }

        if (decreaseBtn) {
            decreaseBtn.addEventListener("click", function () {
                ensureBookInCollection();
                if (totalPages <= 0) return;
                let currentValue = progressSlider ? parseInt(progressSlider.value, 10) : parseInt(currentPageEl.textContent, 10);
                let newPages = Math.max(0, currentValue - 1);
                if (progressSlider) progressSlider.value = newPages;
                updateProgress(newPages, false);
                animateUpdateButton();
                console.log(`Decrease button clicked. New value (not saved): ${newPages}`);
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener("click", function () {
                ensureBookInCollection();
                if (totalPages <= 0) return;
                let currentValue = progressSlider ? parseInt(progressSlider.value, 10) : parseInt(currentPageEl.textContent, 10);
                let newPages = Math.min(totalPages, currentValue + 1);
                if (progressSlider) progressSlider.value = newPages;
                updateProgress(newPages, false);
                animateUpdateButton();
                console.log(`Increase button clicked. New value (not saved): ${newPages}`);
            });
        }

        if (pageInput) {
            pageInput.addEventListener("input", animateUpdateButton);
            pageInput.addEventListener("keypress", function (e) {
                if (e.key === "Enter") {
                    console.log("Enter pressed in page input.");
                    e.preventDefault();
                    updatePagesFromInput();
                }
            });
        }

        if (updatePagesBtn) {
            updatePagesBtn.addEventListener("click", function () {
                ensureBookInCollection().then(() => {
                    if (!isProgressChanged) {
                        showNotification("Нет изменений для сохранения", false);
                        return;
                    }
                    const pages = parseInt(pageInput.value, 10);
                    if (isNaN(pages)) {
                        showNotification("Некорректное значение страниц", true);
                        return;
                    }
                    updateProgress(pages, true);
                    isProgressChanged = false;
                    checkStatusAfterProgressUpdate(pages);
                });
            });
        }
    }

    // Обработчик удаления отзыва
    document.addEventListener("click", function(e) {
        if (e.target.closest(".delete-review-btn")) {
            e.preventDefault();
            const btn = e.target.closest(".delete-review-btn");
            const reviewId = btn.getAttribute("data-review-id");
            if (confirm("Вы уверены, что хотите удалить этот отзыв?")) {
                deleteReview(reviewId);
            }
        }
    });

    // Общие функции
    bookDescription = document.getElementById("book-description");
    if (bookDescription) {
        // formatBookDescription(bookDescription);
    }

    // Функции для авторизованных
    function initSlider() {
        if (!progressSlider || totalPages <= 0) return;
        progressSlider.min = 0;
        progressSlider.max = totalPages;
        progressSlider.step = 1;
        const initialPage = currentPageEl ? parseInt(currentPageEl.textContent, 10) || 0 : 0;
        progressSlider.value = Math.min(totalPages, Math.max(0, initialPage));
        updateSliderTooltip(progressSlider.value);
        console.log(`Slider initialized: min=0, max=${progressSlider.max}, value=${progressSlider.value}`);
    }

    function handleSliderInput() {
        const pages = parseInt(this.value, 10);
        updateProgress(pages, false);
        updateSliderTooltip(pages);
    }

    function handleSliderChange() {
        const pages = parseInt(this.value, 10);
        console.log(`Slider change committed. New value: ${pages}`);
        updateProgress(pages, false);
        animateUpdateButton();
        if (isAuthenticated) {
            showNotification("Не забудьте сохранить изменения", false);
        }
    }

    function updatePagesFromInput() {
        ensureBookInCollection();
        if (!pageInput || totalPages <= 0) return;
        let pages = parseInt(pageInput.value, 10);
        if (isNaN(pages)) pages = currentPageEl ? parseInt(currentPageEl.textContent, 10) || 0 : 0;
        pages = Math.max(0, Math.min(totalPages, pages));
        console.log(`Updating pages from input to: ${pages}`);
        if (progressSlider) progressSlider.value = pages;
        updateProgress(pages, false);
        if (updatePagesBtn) {
            updatePagesBtn.classList.add('pulse');
            setTimeout(() => { updatePagesBtn.classList.remove('pulse'); }, 800);
        }
    }

    function getCSRFToken() {
        return csrfTokenInput ? csrfTokenInput.value : null;
    }

    function loadBookData() {
        if (!bookId) return;
        console.log(`Loading book data for book ID: ${bookId}`);
        fetch(`/get_book_status/?book_id=${bookId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(response => {
                if (!response.ok) throw new Error(`Network response error: ${response.statusText} (${response.status})`);
                return response.json();
            })
            .then(data => {
                console.log("Book data received:", data);
                hasBookInCollection = data.exists;
                let initialProgress = 0;
                if (data.exists && data.progress !== undefined && data.progress !== null) {
                    currentBookStatus = data.status;
                    updateStatusButton(data.status);
                    initialProgress = Math.max(0, Math.min(totalPages, data.progress));
                    if (data.status === "read") initialProgress = totalPages;
                } else {
                    currentBookStatus = "";
                    updateStatusButton("");
                }
                updateProgress(initialProgress, false);
                if (progressSlider) {
                    progressSlider.value = initialProgress;
                    updateSliderTooltip(initialProgress);
                }
                if (initialProgress === totalPages && totalPages > 0) {
                    createSparkles(progressFill);
                }
            })
            .catch(error => {
                console.error("Ошибка загрузки данных статуса книги:", error);
                currentBookStatus = "";
                updateStatusButton("");
                updateProgress(0, false);
                if (progressSlider) {
                    progressSlider.value = 0;
                    updateSliderTooltip(0);
                }
            });
    }

function updateProgress(pagesRead, saveToServer) {
    if (!progressFill || !progressText || !currentPageEl || totalPages <= 0) {
        if (totalPages <= 0) console.warn("Cannot update progress: total pages is 0.");
        else console.warn("Progress elements missing, cannot update progress display.");
        return;
    }

    pagesRead = Math.max(0, Math.min(totalPages, pagesRead));
    const percentage = (pagesRead / totalPages) * 100;
    const roundedPercentage = Math.round(percentage * 10) / 10;

    progressFill.style.width = percentage + "%";
    progressText.textContent = roundedPercentage + "%";
    currentPageEl.textContent = pagesRead;

    if (pageInput && document.activeElement !== pageInput) {
        pageInput.value = pagesRead;
    }

    updateSliderTooltip(pagesRead);
    console.log(`Progress updated: ${pagesRead}/${totalPages} pages (${roundedPercentage}%) - SaveToServer: ${saveToServer}`);

    if (saveToServer && isAuthenticated && bookId) {
        if (!hasBookInCollection) {
            updateBookStatus("reading");
            hasBookInCollection = true;
        }
        saveProgressToServer(pagesRead);
        showNotification("Данные успешно обновлены");
    } else {
        isProgressChanged = true;
    }

    if (saveToServer && pagesRead > 0) createSparkles(progressFill);
}

    function updateSliderTooltip(pages) {
        if (!sliderTooltip || !progressSlider || totalPages <= 0) return;
        const thumbPositionPercent = (pages / totalPages) * 100;
        const sliderWidth = progressSlider.offsetWidth || 200;
        const thumbWidth = 20;
        const offset = (thumbWidth / 2) - (thumbPositionPercent / 100 * thumbWidth);
        sliderTooltip.textContent = `${pages} стр.`;
        sliderTooltip.style.left = `calc(${thumbPositionPercent}% + ${offset}px)`;
    }

    function saveProgressToServer(pagesRead) {
        const token = getCSRFToken();
        if (!token) { console.error("CSRF Token missing."); return; }
        if (!bookId) { console.error("Book ID missing."); return; }
        const percentage = totalPages > 0 ? (pagesRead / totalPages) * 100 : 0;
        console.log(`Saving progress: bookId=${bookId}, pages=${pagesRead}, percent=${percentage}`);
        fetch("/update-progress/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": token, 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ book_id: bookId, progress: pagesRead, progress_percent: percentage }),
        })
            .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
            .then(data => {
                if (data.status === "success") {
                    console.log("Progress saved successfully.");
                    // Обновляем статус, если он изменился
                    if (data.current_status && data.current_status !== currentBookStatus) {
                        currentBookStatus = data.current_status;
                        updateStatusButton(data.current_status);
                        updateBooksCountersInProfile();
                    }
                } else {
                    console.error("Error saving progress:", data.message);
                    showNotification(`Ошибка сохранения: ${data.message || 'Неизвестная ошибка'}`, true);
                }
            })
            .catch(error => {
                console.error("Network error saving progress:", error);
                const message = error.message || (typeof error === 'string' ? error : 'Ошибка соединения');
                showNotification(`Ошибка сохранения: ${message}`, true);
            });
    }

    function updateBooksCountersInProfile() {
        fetch('/get_books_count/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновляем счетчики на текущей странице, если они есть
                    const counters = {
                        'read': document.querySelector('.tab[data-tab="read"] .counter'),
                        'reading': document.querySelector('.tab[data-tab="reading"] .counter'),
                        'want-to-read': document.querySelector('.tab[data-tab="want-to-read"] .counter')
                    };

                    for (const [status, counter] of Object.entries(counters)) {
                        if (counter) {
                            counter.textContent = data.counts[status] || '0';
                        }
                    }
                }
            })
            .catch(error => console.error('Error updating counters:', error));
    }

    function updateBookStatus(status) {
        const token = getCSRFToken();
        if (!token) {
            console.error("CSRF Token missing.");
            showNotification("Ошибка аутентификации", true);
            return;
        }
        if (!bookId) {
            console.error("Book ID missing.");
            return;
        }
        if (currentBookStatus === status) {
            console.log(`Status already set to ${status}. No update needed.`);
            return;
        }
        const currentPages = currentPageEl ? parseInt(currentPageEl.textContent, 10) || 0 : 0;
        const progressToSend = status === 'read' ? totalPages : currentPages;
        const percentToSend = status === 'read' ? 100 : (totalPages > 0 ? (progressToSend / totalPages) * 100 : 0);
        console.log(`Updating status: status=${status}, bookId=${bookId}, progress=${progressToSend}, percent=${percentToSend}`);
        fetch("/update_book_status/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                book_id: bookId,
                status: status,
                progress: progressToSend,
                progress_percent: percentToSend
            })
        })
        .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
        .then(data => {
            if (data.success || data.status === 'success') {
                console.log(`Status updated to: ${status}`);
                currentBookStatus = status;
                hasBookInCollection = true;
                updateStatusButton(status);
                updateBooksCountersInProfile(); // Добавлено для синхронизации
                showNotification(`Статус книги обновлен на "${getStatusName(status)}"`);
                if (status === 'read' && totalPages > 0) {
                    updateProgress(totalPages, false);
                    createSparkles(progressFill);
                }
            } else {
                const message = data.message || data.error || 'Неизвестная ошибка';
                console.error("Error updating status:", message);
            }
        })
        .catch(error => {
            console.error("Network error updating status:", error);
            const message = error.message || (typeof error === 'string' ? error : 'Ошибка соединения');
            showNotification(`Ошибка обновления статуса: ${message}`, true);
        });
    }

    function checkStatusAfterProgressUpdate(pagesRead) {
        if (currentBookStatus === "read" && pagesRead < totalPages) {
            updateBookStatus("reading");
        }
    }

    function updateStatusButton(status) {
        if (!statusMainButton || !statusMainText) return;
        statusMainButton.classList.remove("reading", "want-to-read", "read");
        let text = "Добавить в мои книги";
        switch (status) {
            case "reading": statusMainButton.classList.add("reading"); text = "Читаю"; break;
            case "want-to-read": statusMainButton.classList.add("want-to-read"); text = "В планах"; break;
            case "read": statusMainButton.classList.add("read"); text = "Прочитано"; break;
        }
        statusMainText.textContent = text;
    }

    function ensureBookInCollection() {
        return new Promise((resolve) => {
            if (!hasBookInCollection) {
                console.log("Book not in collection. Adding to 'reading' status automatically.");
                updateBookStatus("reading").then(() => {
                    hasBookInCollection = true;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    function formatBookDescription(element) {
        // Оставьте пустым или добавьте свою логику
    }

    function createSparkles(container) {
        if (!container) return;
        const sparklesContainer = container.querySelector(".progress-bar-sparkles");
        if (!sparklesContainer) return;
        sparklesContainer.innerHTML = "";
        const widthPercent = parseFloat(container.style.width) || 0;
        if (widthPercent > 5) {
            const numSparkles = Math.min(8, Math.floor(widthPercent / 10));
            for (let i = 0; i < numSparkles; i++) {
                const sparkle = document.createElement("div");
                sparkle.className = "sparkle";
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.top = `${Math.random() * 60 + 20}%`;
                const size = `${Math.random() * 3 + 2}px`;
                sparkle.style.width = size; sparkle.style.height = size;
                sparkle.style.animationDelay = `${Math.random() * 1.5}s`;
                sparkle.style.animationDuration = `${Math.random() * 1 + 1}s`;
                sparklesContainer.appendChild(sparkle);
            }
        }
    }

    function getStatusName(status) {
        const names = { "reading": "Читаю", "want-to-read": "В планах", "read": "Прочитано" };
        return names[status] || status;
    }

    function deleteReview(reviewId) {
        const token = getCSRFToken();
        fetch(`/delete_review/${reviewId}/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": token,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification("Отзыв успешно удален");
                location.reload();
            } else {
                showNotification("Ошибка при удалении отзыва", true);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка при удалении отзыва", true);
        });
    }

    let notificationTimeout;
    function showNotification(message, isError = false) {
        const existingNotification = document.querySelector(".notification.show");
        if (existingNotification) {
            existingNotification.classList.remove("show");
            setTimeout(() => existingNotification.remove(), 400);
        }
        const notification = document.createElement("div");
        notification.className = `notification ${isError ? "error" : "success"}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add("show"), 10);
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    function animateUpdateButton() {
        if (updatePagesBtn) {
            updatePagesBtn.classList.add('pulse');
            setTimeout(() => { updatePagesBtn.classList.remove('pulse'); }, 800);
        }
    }
});