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

const form = document.getElementById('change-password-form');
const oldPassword = document.getElementById('old_password');
const password1 = document.getElementById('new_password1');
const password2 = document.getElementById('new_password2');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');

// Валидация
function validatePassword(value) {
    if (!value) return { valid: false, message: 'Введите пароль' };
    if (value.length < CONFIG.MIN_PASSWORD_LENGTH || value.length > CONFIG.MAX_PASSWORD_LENGTH) {
        return { valid: false, message: `Пароль должен быть от ${CONFIG.MIN_PASSWORD_LENGTH} до ${CONFIG.MAX_PASSWORD_LENGTH} символов` };
    }
    if (/[\u0400-\u04FF]/.test(value)) {
        return { valid: false, message: 'Пароль не должен содержать кириллицу' };
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
        return { valid: false, message: 'Минимум 1 заглавная, 1 строчная буква и 1 цифра' };
    }
    return { valid: true };
}

function validatePasswordMatch(p1, p2) {
    if (!p2) return { valid: false, message: 'Подтвердите пароль' };
    if (p1 !== p2) return { valid: false, message: 'Пароли не совпадают' };
    return { valid: true };
}

function validatePasswordNotSame(oldPass, newPass) {
    if (oldPass === newPass) return { valid: false, message: 'Новый пароль не должен совпадать со старым' };
    return { valid: true };
}

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

function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

function setLoadingState(isLoading) {
    submitText.style.display = isLoading ? 'none' : 'inline-block';
    submitSpinner.style.display = isLoading ? 'inline-block' : 'none';
    form.querySelector('button[type="submit"]').disabled = isLoading;
}

function setError(input, message = '') {
    const group = input.closest('.input-group');
    if (!group) return;
    group.classList.toggle('error', !!message);
    const errorEl = group.querySelector('.error-message');
    if (errorEl) {
        // Очищаем существующие серверные ошибки и устанавливаем новое сообщение
        errorEl.innerHTML = message;
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    setLoadingState(true);

    // Очищаем все ошибки, включая серверные
    [oldPassword, password1, password2].forEach(input => setError(input, ''));

    const oldPass = oldPassword.value.trim();
    const newPass = password1.value.trim();
    const confirmPass = password2.value.trim();

    const passwordValidation = validatePassword(newPass);
    const matchValidation = validatePasswordMatch(newPass, confirmPass);
    const notSameValidation = validatePasswordNotSame(oldPass, newPass);

    // Устанавливаем ошибки, если валидация не пройдена
    if (!passwordValidation.valid) setError(password1, passwordValidation.message);
    if (!matchValidation.valid) setError(password2, matchValidation.message);
    if (!notSameValidation.valid) setError(password1, notSameValidation.message);

    if (passwordValidation.valid && matchValidation.valid && notSameValidation.valid) {
        // Показываем уведомление и отправляем форму
        // showNotification('Пароль успешно изменён!', 'success');
        setTimeout(() => {
            setLoadingState(false);
            form.submit();
        }, 1500);
    } else {
        // Если валидация не пройдена, возвращаем фокус на первое поле с ошибкой
        setLoadingState(false);
        document.querySelector('.input-group.error input')?.focus();
    }
}

function setupLiveValidation() {
    oldPassword.addEventListener('input', () => {
        const oldPass = oldPassword.value.trim();
        const newPass = password1.value.trim();
        const confirmPass = password2.value.trim();

        if (newPass) {
            const passwordValidation = validatePassword(newPass);
            const notSameValidation = validatePasswordNotSame(oldPass, newPass);
            setError(password1, !passwordValidation.valid || !notSameValidation.valid ? (passwordValidation.valid ? notSameValidation.message : passwordValidation.message) : '');
        }

        if (confirmPass) {
            const matchValidation = validatePasswordMatch(newPass, confirmPass);
            setError(password2, !matchValidation.valid ? matchValidation.message : '');
        }
    });

    password1.addEventListener('input', () => {
        const oldPass = oldPassword.value.trim();
        const newPass = password1.value.trim();
        const confirmPass = password2.value.trim();

        const passwordValidation = validatePassword(newPass);
        const notSameValidation = validatePasswordNotSame(oldPass, newPass);
        setError(password1, !passwordValidation.valid || !notSameValidation.valid ? (passwordValidation.valid ? notSameValidation.message : passwordValidation.message) : '');

        if (confirmPass) {
            const matchValidation = validatePasswordMatch(newPass, confirmPass);
            setError(password2, !matchValidation.valid ? matchValidation.message : '');
        }
    });

    password2.addEventListener('input', () => {
        const newPass = password1.value.trim();
        const confirmPass = password2.value.trim();

        const matchValidation = validatePasswordMatch(newPass, confirmPass);
        setError(password2, !matchValidation.valid ? matchValidation.message : '');
    });
}

if (form) {
    form.addEventListener('submit', handleSubmit);
    setupLiveValidation();
}