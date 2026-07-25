// 1. DỮ LIỆU DANH SÁCH GAME ĐƯỢC BỔ SUNG NHIỀU GAME HOT MỚI
const gamesData = [
    { id: 1, title: "Forza Horizon 6 (No Xbox Re...)", category: "Driving Sim, Racing, Speed", tab: "latest", image: "https://cdn.akamai.steamstatic.com/steam/apps/1293830/header.jpg" },
    { id: 2, title: "eFootball™ 2024 / PES 2021", category: "Competitive 3D, Sports, Football", tab: "sports", image: "https://cdn.akamai.steamstatic.com/steam/apps/2125100/header.jpg" },
    { id: 3, title: "Grand Theft Auto V (GTA 5)", category: "Open World, Crime, Action", tab: "action", image: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg" },
    { id: 4, title: "Black Myth: Wukong", category: "Action RPG, Souls-like, Mythology", tab: "foryou", image: "https://cdn.akamai.steamstatic.com/steam/apps/2358720/header.jpg" },
    { id: 5, title: "Cyberpunk 2077", category: "Open World, Sci-Fi, RPG", tab: "action", image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg" },
    { id: 6, title: "FC Online / EA SPORTS FC™ 25", category: "Sports, Football, Simulation", tab: "sports", image: "https://cdn.akamai.steamstatic.com/steam/apps/2195250/header.jpg" },
    { id: 7, title: "Need for Speed™ Unbound", category: "Racing, Driving, Tuning", tab: "racing", image: "https://cdn.akamai.steamstatic.com/steam/apps/1846380/header.jpg" },
    { id: 8, title: "Portal 2", category: "Puzzle, Co-op, Sci-Fi", tab: "puzzle", image: "https://cdn.akamai.steamstatic.com/steam/apps/620/header.jpg" },
    { id: 9, title: "A Dance of Fire and Ice", category: "Rhythm, Music, Difficult", tab: "rhythm", image: "https://cdn.akamai.steamstatic.com/steam/apps/977950/header.jpg" },
    { id: 10, title: "Palworld", category: "Open World, Sandbox, Crafting", tab: "sandbox", image: "https://cdn.akamai.steamstatic.com/steam/apps/1623730/header.jpg" },
    { id: 11, title: "Minecraft Java Edition", category: "Sandbox, Adventure, Crafting", tab: "sandbox", image: "https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg" },
    { id: 12, title: "Elden Ring", category: "Fantasy, Dark Fantasy, Open World", tab: "action", image: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg" }
];

// BIẾN QUẢN LÝ TIẾN TRÌNH LÀM MỚI TỰ ĐỘNG (REAL-TIME)
let queueInterval = null;
let fpsInterval = null;
let currentQueuePos = 108;
let currentTotalSeconds = 11556; // 192 phút 36 giây

// 2. TỰ ĐỘNG KHỞI TẠO ID NGƯỜI DÙNG TỰ ĐỘNG THEO MÁY
function initDeviceUserId() {
    let savedId = localStorage.getItem('coffee_go_user_id');
    if (!savedId) {
        const randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
        savedId = 'u' + randomHex;
        localStorage.setItem('coffee_go_user_id', savedId);
    }
    
    const userIdDisplay = document.getElementById('userIdDisplay');
    const modalTransferMemo = document.getElementById('modalTransferMemo');
    
    if (userIdDisplay) userIdDisplay.textContent = 'ID: ' + savedId;
    if (modalTransferMemo) modalTransferMemo.textContent = 'CG ' + savedId.substring(0, 9);
}

// 3. HIỆU ỨNG HÀNG CHỜ VÀ FPS CHẠY ĐỘNG (KHÔNG BỊ ĐỨNG HÌNH)
function startDynamicQueue() {
    currentQueuePos = Math.floor(Math.random() * 20) + 95; // Bắt đầu ở ~100
    currentTotalSeconds = currentQueuePos * 105;

    updateQueueUI();

    // Xóa interval cũ nếu có
    if (queueInterval) clearInterval(queueInterval);
    if (fpsInterval) clearInterval(fpsInterval);

    // Đếm ngược thời gian và vị trí xếp hàng liên tục
    queueInterval = setInterval(() => {
        if (currentTotalSeconds > 5) {
            currentTotalSeconds -= 3; // Giảm thời gian
            if (Math.random() > 0.4 && currentQueuePos > 1) {
                currentQueuePos--; // Giảm vị trí hàng chờ
            }
            updateQueueUI();
        } else {
            document.getElementById('queuePos').textContent = "0";
            document.getElementById('queueTime').textContent = "Ready! Entering Game...";
            clearInterval(queueInterval);
        }
    }, 1500);

    // Nhảy chỉ số FPS ngẫu nhiên giống đang trong game (55 - 60 FPS)
    fpsInterval = setInterval(() => {
        const randomFps = Math.floor(Math.random() * 6) + 55;
        document.getElementById('fpsValue').textContent = randomFps;
    }, 800);
}

function updateQueueUI() {
    const queuePosEl = document.getElementById('queuePos');
    const queueTimeEl = document.getElementById('queueTime');
    const loadingBarFill = document.getElementById('loadingBarFill');

    if (queuePosEl) queuePosEl.textContent = currentQueuePos;

    // Chuyển giây thành định dạng Minutes & Seconds
    const mins = Math.floor(currentTotalSeconds / 60);
    const secs = currentTotalSeconds % 60;
    if (queueTimeEl) queueTimeEl.textContent = `${mins} min ${secs} sec`;

    // Cập nhật thanh năng lượng loading
    const progressPercent = Math.min(100, Math.max(5, Math.floor(((108 - currentQueuePos) / 108) * 100)));
    if (loadingBarFill) loadingBarFill.style.width = progressPercent + '%';
}

function stopDynamicQueue() {
    if (queueInterval) clearInterval(queueInterval);
    if (fpsInterval) clearInterval(fpsInterval);
}

// 4. BẤM PLAY GAME
function playGame(gameId) {
    const game = gamesData.find(g => g.id === gameId);
    if (!game) return;

    const gameScreen = document.getElementById('gameLoadingScreen');
    const loadingGameTitle = document.getElementById('loadingGameTitle');
    
    if (loadingGameTitle) loadingGameTitle.textContent = "Starting " + game.title;
    gameScreen.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${game.image}')`;

    // Kích hoạt giao diện & hiệu ứng động
    gameScreen.classList.remove('hidden');
    startDynamicQueue();

    // Khóa màn hình ngang nếu thiết bị hỗ trợ
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
    }
}

function renderGames(filterTab, searchQuery = '') {
    const container = document.getElementById('gameCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    const filteredGames = gamesData.filter(game => {
        const matchesCategory = (filterTab === 'foryou') || (filterTab === 'latest') || (game.tab === filterTab);
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              game.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredGames.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#818793; margin-top:30px;">Không tìm thấy game phù hợp.</p>`;
        return;
    }

    filteredGames.forEach(game => {
        const cardHTML = `
            <div class="big-game-card">
                <div class="card-banner">
                    <img src="${game.image}" alt="${game.title}">
                </div>
                <div class="card-bottom-bar">
                    <div class="card-info">
                        <h3>${game.title}</h3>
                        <p>${game.category}</p>
                    </div>
                    <button class="btn-play-green" onclick="playGame(${game.id})">PLAY</button>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

function switchTab(targetTabId) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const tabPages = document.querySelectorAll('.tab-page');

    navItems.forEach(n => {
        if (n.getAttribute('data-tab') === targetTabId) {
            n.classList.add('active');
        } else {
            n.classList.remove('active');
        }
    });

    tabPages.forEach(page => {
        if (page.id === targetTabId) {
            page.classList.remove('hidden');
            page.classList.add('active');
        } else {
            page.classList.add('hidden');
            page.classList.remove('active');
        }
    });
}

async function openPaymentModal(planName, priceText) {
    const modal = document.getElementById('qrModalOverlay');
    const modalPlanName = document.getElementById('modalPlanName');
    const modalPriceText = document.getElementById('modalPriceText');
    const qrCodeImg = document.getElementById('qrCodeImg');

    modalPlanName.textContent = planName;
    modalPriceText.textContent = priceText;

    const currentUserId = localStorage.getItem('coffee_go_user_id') || 'u24df521a07c9c49';
    const amountOnly = priceText.split(' ')[0].replace(/\./g, '');
    const memo = 'CG ' + currentUserId.substring(0, 8);

    const localQrPath = '/qr_custom.png';
    const remoteQrPath = 'https://i.imgur.com/JeJI3GA.png';
    try {
        const head = await fetch(localQrPath, { method: 'HEAD' });
        if (head.ok) {
            qrCodeImg.src = localQrPath;
        } else {
            qrCodeImg.src = remoteQrPath;
        }
    } catch (e) {
        qrCodeImg.src = remoteQrPath;
    }

    modal.classList.remove('hidden');
}

// 5. EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    initDeviceUserId();

    

    // Simple device detection for iPad/tablet widths to apply optimized layout
    function updateDeviceClass() {
        if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
            document.body.classList.add('device-ipad');
        } else {
            document.body.classList.remove('device-ipad');
        }
        if (window.innerWidth > 1024) {
            document.body.classList.add('device-desktop');
        } else {
            document.body.classList.remove('device-desktop');
        }
    }
    updateDeviceClass();
    window.addEventListener('resize', updateDeviceClass);

    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const btnLoginGoogle = document.getElementById('btnLoginGoogle');
    const chkTerms = document.getElementById('chkTerms');

    // Đăng nhập Google
    btnLoginGoogle.addEventListener('click', () => {
        if (!chkTerms.checked) {
            alert('Vui lòng đồng ý với Điều khoản!');
            return;
        }
        // ensure we have a device user id
        let savedId = localStorage.getItem('coffee_go_user_id');
        if (!savedId) {
            initDeviceUserId();
            savedId = localStorage.getItem('coffee_go_user_id');
        }

        // send login info to server
        const payload = {
            user_id: savedId,
            username: 'Guest',
            device_type: navigator.userAgent || navigator.platform || 'Unknown'
        };
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.json()).then(data => {
            console.log('Logged in to server:', data);
        }).catch(err => {
            console.warn('Failed to call /api/login', err);
        });

        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        renderGames('latest');
    });

    // Ô Tìm kiếm Game
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeCat = document.querySelector('.cat-item.active');
            const cat = activeCat ? activeCat.getAttribute('data-category') : 'latest';
            renderGames(cat, e.target.value);
        });
    }

    // Nút Exit thoát Game
    const btnExitGame = document.getElementById('btnExitGame');
    const gameLoadingScreen = document.getElementById('gameLoadingScreen');

    btnExitGame.addEventListener('click', () => {
        stopDynamicQueue();
        gameLoadingScreen.classList.add('hidden');
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    });

    // Nút Bật/Tắt Mic
    const btnToggleMic = document.getElementById('btnToggleMic');
    btnToggleMic.addEventListener('click', () => {
        btnToggleMic.classList.toggle('muted');
        const icon = btnToggleMic.querySelector('i');
        if (btnToggleMic.classList.contains('muted')) {
            icon.className = "fa-solid fa-microphone-slash";
        } else {
            icon.className = "fa-solid fa-microphone";
        }
    });

    // Nút Bật/Tắt Audio
    const btnToggleAudio = document.getElementById('btnToggleAudio');
    btnToggleAudio.addEventListener('click', () => {
        btnToggleAudio.classList.toggle('muted');
        const icon = btnToggleAudio.querySelector('i');
        if (btnToggleAudio.classList.contains('muted')) {
            icon.className = "fa-solid fa-volume-xmark";
        } else {
            icon.className = "fa-solid fa-volume-high";
        }
    });

    // Nút Toàn màn hình
    const btnFullscreen = document.getElementById('btnFullscreen');
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    });

    // Nút Nâng cấp VIP Bỏ qua hàng chờ
    const btnBoostVIP = document.getElementById('btnBoostVIP');
    btnBoostVIP.addEventListener('click', () => {
        btnExitGame.click();
        switchTab('tabStore');
    });

    // Chuyển Tab danh mục
    const catItems = document.querySelectorAll('.cat-item');
    catItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            catItems.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            renderGames(item.getAttribute('data-category'), searchInput ? searchInput.value : '');
        });
    });

    // Bottom Navigation
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.getAttribute('data-tab'));
        });
    });

    // Đổi tên 1 lần
    let hasChangedName = false;
    const btnEditName = document.getElementById('btnEditName');
    const userNameDisplay = document.getElementById('userNameDisplay');

    btnEditName.addEventListener('click', () => {
        if (hasChangedName) {
            alert("Bạn đã hết lượt đổi tên!");
            return;
        }

        const newName = prompt("Nhập tên mới của bạn (Chỉ được đổi 1 lần):", userNameDisplay.textContent);
        if (newName && newName.trim() !== "") {
            userNameDisplay.textContent = newName.trim();
            hasChangedName = true;
            btnEditName.classList.add('disabled');
            alert("Đổi tên thành công!");
        }
    });

    // Modal QR
    const btnCloseModal = document.getElementById('btnCloseModal');
    const qrModalOverlay = document.getElementById('qrModalOverlay');

    btnCloseModal.addEventListener('click', () => {
        qrModalOverlay.classList.add('hidden');
    });

    qrModalOverlay.addEventListener('click', (e) => {
        if (e.target === qrModalOverlay) {
            qrModalOverlay.classList.add('hidden');
        }
    });
});