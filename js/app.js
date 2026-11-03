import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, addDoc, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginModal = document.getElementById('login-modal');
const authSection = document.getElementById('auth-section');
const grid = document.getElementById('content-grid');

// Моковые данные (позже заменим на fetch к TMDB API)
const mediaItems = [
    { id: 1, title: "Начало", type: "Фильм", img: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg" },
    { id: 2, title: "Атака Титанов", type: "Аниме", img: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" },
    { id: 3, title: "Во все тяжкие", type: "Сериал", img: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" }
];

// Проверка состояния авторизации
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.innerHTML = `<span>Привет, ${user.email.split('@')[0]}</span> <button id="logout-btn" class="btn-primary">Выйти</button>`;
        document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
    } else {
        authSection.innerHTML = `<button id="open-login" class="btn-primary">Войти</button>`;
        document.getElementById('open-login').addEventListener('click', () => loginModal.classList.remove('hidden'));
    }
});

// Логика входа/регистрации
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        loginModal.classList.add('hidden');
    } catch (err) {
        document.getElementById('auth-error').innerText = err.message;
    }
});

document.getElementById('register-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        loginModal.classList.add('hidden');
    } catch (err) {
        document.getElementById('auth-error').innerText = err.message;
    }
});

// Рендер карточек с анимацией появления
function renderGrid() {
    grid.innerHTML = '';
    mediaItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card glass-card slide-up';
        // Задержка анимации для эффекта каскада
        card.style.animationDelay = `${index * 0.1}s`; 
        
        card.innerHTML = `
            <img src="${item.img}" alt="${item.title}">
            <div class="card-info">
                <h3>${item.title}</h3>
                <p>${item.type}</p>
                <select class="rating-select" data-id="${item.id}">
                    <option value="0">Оценить</option>
                    <option value="10">10 - Шедевр</option>
                    <option value="8">8 - Отлично</option>
                    <option value="5">5 - Нормально</option>
                    <option value="1">1 - Ужасно</option>
                </select>
            </div>
        `;
        grid.appendChild(card);
    });

    // Слушатели для сохранения оценок
    document.querySelectorAll('.rating-select').forEach(select => {
        select.addEventListener('change', saveRating);
    });
}

async function saveRating(e) {
    if (!auth.currentUser) {
        alert("Пожалуйста, войдите в аккаунт!");
        e.target.value = "0";
        return;
    }
    
    const rating = e.target.value;
    const mediaId = e.target.getAttribute('data-id');
    
    try {
        await addDoc(collection(db, "ratings"), {
            userId: auth.currentUser.uid,
            mediaId: mediaId,
            score: parseInt(rating),
            timestamp: new Date()
        });
        alert("Оценка сохранена!");
    } catch (err) {
        console.error("Ошибка сохранения: ", err);
    }
}

// Инициализация
renderGrid();
