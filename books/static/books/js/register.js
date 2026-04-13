// Градиент фон


function moveGradient(e) {
    const x = e.clientX / window.innerWidth * 100;
    const y = e.clientY / window.innerHeight * 100;
    
    document.body.style.background = 
        `radial-gradient(circle at ${x}% ${y}%, 
         #ee7752, #e73c7e, #23a6d5, #23d5ab)`;
}

// Устанавливаем обработчик движения мыши
document.addEventListener('mousemove', moveGradient);

// Инициализируем градиент в центре при загрузке
window.onload = function() {
    document.body.style.background = 
        `radial-gradient(circle at 50% 50%, 
         #ee7752, #e73c7e, #23a6d5, #23d5ab)`;
};


// Конфигурация
const CONFIG = {
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 30,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 50,
    MAX_EMAIL_LENGTH: 254
};

// Списки доменов
const POPULAR_DOMAINS = [
    'gmail.com', 'mail.ru', 'yandex.ru', 'yahoo.com',
    'outlook.com', 'hotmail.com', 'icloud.com'
];
const DISPOSABLE_DOMAINS = [
    'tempmail.com', '10minutemail.com', 'mailinator.com',
    'guerrillamail.com', 'yopmail.com', 'trashmail.com'
];

// Элементы формы
const form = document.getElementById('register-form');
const username = document.getElementById('username');
const email = document.getElementById('email');
const password1 = document.getElementById('password1');
const password2 = document.getElementById('password2');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');

// Проверка DNS через API
async function verifyEmailDomain(email) {
    const domain = email.split('@')[1];
    const emailGroup = document.querySelector('.input-group.email-checking');
    emailGroup.classList.add('verifying');
    try {
        // Проверка MX записей
        const mxResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        const mxData = await mxResponse.json();
        if (mxData.Answer && mxData.Answer.length > 0) {
            return true;
        }
        // Проверка A записей
        const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const aData = await aResponse.json();
        return aData.Answer && aData.Answer.length > 0;
    } catch (error) {
        console.error('DNS verification failed:', error);
        return false;
    } finally {
        emailGroup.classList.remove('verifying');
    }
}

// Полная проверка email
async function validateEmail(email) {
    // 1. Проверка формата
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return { valid: false, message: 'Некорректный формат email' };
    }
    const domain = email.split('@')[1].toLowerCase();
    // 2. Проверка популярных доменов
    if (POPULAR_DOMAINS.includes(domain)) {
        return { valid: true };
    }
    // 3. Проверка одноразовых email
    if (DISPOSABLE_DOMAINS.some(d => domain.includes(d))) {
        return { valid: false, message: 'Одноразовые email не принимаются' };
    }
    // 4. DNS проверка
    const domainExists = await verifyEmailDomain(email);
    if (!domainExists) {
        return { valid: false, message: 'Домен не существует или не принимает почту' };
    }
    return { valid: true };
}

// Валидация имени пользователя
function validateUsername(value) {
    if (!value) return { valid: false, message: 'Введите имя пользователя' };
    if (value.length < CONFIG.MIN_USERNAME_LENGTH || value.length > CONFIG.MAX_USERNAME_LENGTH) {
        return { valid: false, message: `Имя должно быть от ${CONFIG.MIN_USERNAME_LENGTH} до ${CONFIG.MAX_USERNAME_LENGTH} символов` };
    }
    if (/[\u0400-\u04FF]/.test(value)) {
        return { valid: false, message: 'Имя пользователя не должно содержать кириллические символы' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return { valid: false, message: 'Только буквы латинского алфавита' };
    }
    
    return { valid: true };
}

// Валидация пароля
function validatePassword(value, username) {
    if (!value) return { valid: false, message: 'Введите пароль' };
    if (value.length < CONFIG.MIN_PASSWORD_LENGTH || value.length > CONFIG.MAX_PASSWORD_LENGTH) {
        return { valid: false, message: `Пароль должен быть от ${CONFIG.MIN_PASSWORD_LENGTH} до ${CONFIG.MAX_PASSWORD_LENGTH} символов` };
    }
    if (/[\u0400-\u04FF]/.test(value)) {
        return { valid: false, message: 'Пароль не должен содержать кириллические символы' };
    }
    if (value.toLowerCase() === username.toLowerCase()) {
        return { valid: false, message: 'Пароль не должен совпадать с именем пользователя' };
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
        return { valid: false, message: 'Минимум 1 заглавную, 1 строчную буквы, 1 цифру' };
    }
    
    
    return { valid: true };
}

// Валидация совпадения паролей
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

// Социальная авторизация
function handleSocialAuth(provider) {
    showNotification(`Перенаправление на ${provider}...`, 'warning');
    console.log(`Auth with ${provider}`);
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
    [username, email, password1, password2].forEach(field => setError(field));
    // Валидация полей
    const usernameValidation = validateUsername(username.value.trim());
    const emailValidation = await validateEmail(email.value.trim());
    const passwordValidation = validatePassword(password1.value.trim(), username.value.trim());
    const passwordMatchValidation = validatePasswordMatch(
        password1.value.trim(),
        password2.value.trim()
    );
    // Устанавливаем ошибки
    if (!usernameValidation.valid) setError(username, usernameValidation.message);
    if (!emailValidation.valid) setError(email, emailValidation.message);
    if (!passwordValidation.valid) setError(password1, passwordValidation.message);
    if (!passwordMatchValidation.valid) setError(password2, passwordMatchValidation.message);
    // Проверяем общую валидность
    const isValid = usernameValidation.valid && emailValidation.valid &&
                   passwordValidation.valid && passwordMatchValidation.valid;
    if (isValid) {
        // showNotification('Регистрация прошла успешно!', 'success');
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
    username.addEventListener('input', () => {
        const validation = validateUsername(username.value.trim());
        setError(username, username.value.trim() && !validation.valid ? validation.message : '');
    });

    email.addEventListener('blur', async () => {
        const validation = await validateEmail(email.value.trim());
        setError(email, email.value.trim() && !validation.valid ? validation.message : '');
    });

    password1.addEventListener('input', () => {
        const validation = validatePassword(password1.value.trim(), username.value.trim());
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