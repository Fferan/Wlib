// Градиент фон


document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    document.body.style.background = `
        radial-gradient(
            circle at ${x}% ${y}%,
            #ee7752, #e73c7e, #23a6d5, #23d5ab
        )`;
});

// Конфигурация
const CONFIG = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 50
};

// Элементы формы
const form = document.getElementById('password-reset-form');
const password1 = document.getElementById('new_password1');
const password2 = document.getElementById('new_password2');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');

// Валидация пароля
function validatePassword(value) {
    if (!value) return { valid: false, message: 'Введите пароль' };
    if (value.length < CONFIG.MIN_PASSWORD_LENGTH || value.length > CONFIG.MAX_PASSWORD_LENGTH) {
        return { valid: false, message: `Пароль должен быть от ${CONFIG.MIN_PASSWORD_LENGTH} до ${CONFIG.MAX_PASSWORD_LENGTH} символов` };
    }
    if (/[\u0400-\u04FF]/.test(value)) {
        return { valid: false, message: 'Пароль не должен содержать кириллические символы' };
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
        return { valid: false, message: 'Минимум 1 заглавную, 1 строчную буквы, 1 цифру' };
    }
    
    return { valid: true };
}

function validatePasswordMatch(pass1, pass2) {
    if (!pass2) return { valid: false, message: 'Подтвердите пароль' };
    if (pass1 !== pass2) {
        return { valid: false, message: 'Пароли не совпадают' };
    }
    return { valid: true };
}

// Установка/очистка ошибки
function setError(input, message = '') {
    const group = input.closest('.input-group');
    if (!group) return;

    group.classList.toggle('error', !!message);
    const errorEl = group.querySelector('.error-message');
    if (errorEl) errorEl.textContent = message;
}

// Показать уведомление
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Переключение видимости пароля
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Установка состояния загрузки
function setLoadingState(isLoading) {
    if (isLoading) {
        submitText.style.display = 'none';
        submitSpinner.style.display = 'inline-block';
        form.querySelector('button[type="submit"]').disabled = true;
    } else {
        submitText.style.display = 'inline-block';
        submitSpinner.style.display = 'none';
        form.querySelector('button[type="submit"]').disabled = false;
    }
}

// Обработчик отправки формы
async function handleSubmit(e) {
    e.preventDefault();
    setLoadingState(true);

    // Очищаем ошибки
    [password1, password2].forEach(field => setError(field));

    // Валидация полей
    const passwordValidation = validatePassword(password1.value.trim());
    const passwordMatchValidation = validatePasswordMatch(
        password1.value.trim(),
        password2.value.trim()
    );

    // Устанавливаем ошибки
    if (!passwordValidation.valid) setError(password1, passwordValidation.message);
    if (!passwordMatchValidation.valid) setError(password2, passwordMatchValidation.message);

    // Проверяем общую валидность
    const isValid = passwordValidation.valid && passwordMatchValidation.valid;

    if (isValid) {
        // showNotification('Пароль успешно изменен!', 'success');
        setTimeout(() => {
            form.submit();
        }, 1500);
    } else {
        document.querySelector('.input-group.error input')?.focus();
        setLoadingState(false);
    }
}

// Live валидация
function setupLiveValidation() {
    password1.addEventListener('input', () => {
        const validation = validatePassword(password1.value.trim());
        setError(password1, password1.value.trim() && !validation.valid ? validation.message : '');

        if (password2.value.trim()) {
            const matchValidation = validatePasswordMatch(password1.value.trim(), password2.value.trim());
            setError(password2, !matchValidation.valid ? matchValidation.message : '');
        }
    });

    password2.addEventListener('input', () => {
        const validation = validatePasswordMatch(password1.value.trim(), password2.value.trim());
        setError(password2, password2.value.trim() && !validation.valid ? validation.message : '');
    });
}

// Инициализация
if (form) {
    form.addEventListener('submit', handleSubmit);
    setupLiveValidation();
}