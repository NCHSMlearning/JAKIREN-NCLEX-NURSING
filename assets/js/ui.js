// ============================================
// UI MODULE - All UI rendering functions
// ============================================

// Show/hide loading
function showLoading(show) {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showAppContent(show) {
    const content = document.getElementById('appContent');
    if (content) {
        content.style.display = show ? 'block' : 'none';
    }
}

// Format currency
function formatCurrency(amount) {
    return `KES ${amount.toLocaleString()}`;
}

// Get month name
function getMonthName(monthNumber) {
    const months = {
        1: '📚 Fundamentals',
        2: '💉 Medical-Surgical',
        3: '💊 Pharmacology',
        4: '🤰 Maternity & Pediatrics',
        5: '🧠 Psychiatric Nursing',
        6: '⭐ Final Review'
    };
    return months[monthNumber] || `Month ${monthNumber}`;
}

// Show toast notification
function showToast(message, isError = false) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc3545' : '#2e8b57';
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load login page
async function loadLoginPage() {
    const content = document.getElementById('appContent');
    
    content.innerHTML = `
        <div class="auth-card">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="background: linear-gradient(135deg, #0f2b3d, #2a6f8f); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">🏥 JAKIREN NCLEX</h1>
                <p style="color: #64748b; margin-top: 8px;">Premium Nursing Preparation Course</p>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('login')">Login</button>
                <button class="tab-btn" onclick="switchTab('register')">Register</button>
            </div>
            
            <div id="loginTab" class="tab-content active">
                <input type="email" id="loginEmail" class="auth-input" placeholder="Email Address">
                <input type="password" id="loginPassword" class="auth-input" placeholder="Password">
                <button class="btn btn-primary" onclick="handleLoginUI()" style="width: 100%;">Login →</button>
            </div>
            
            <div id="registerTab" class="tab-content">
                <input type="text" id="regName" class="auth-input" placeholder="Full Name">
                <input type="email" id="regEmail" class="auth-input" placeholder="Email Address">
                <input type="password" id="regPassword" class="auth-input" placeholder="Password (min 6 chars)">
                <button class="btn btn-primary" onclick="handleRegisterUI()" style="width: 100%;">Create Account →</button>
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <span>🎓 180 Lectures</span>
                    <span>🎁 First FREE</span>
                    <span>📱 Pay Per Lecture</span>
                </div>
            </div>
        </div>
    `;
    
    showAppContent(true);
    showLoading(false);
}

// Handle login from UI
async function handleLoginUI() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please fill all fields', true);
        return;
    }
    
    await login(email, password);
}

// Handle register from UI
async function handleRegisterUI() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!name || !email || !password) {
        showToast('Please fill all fields', true);
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', true);
        return;
    }
    
    const result = await register(name, email, password);
    if (result.success) {
        switchTab('login');
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
    }
}

// Tab switching
function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const btns = document.querySelectorAll('.tab-btn');
    
    btns.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        btns[0].classList.add('active');
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        btns[1].classList.add('active');
    }
}

// Load dashboard
async function loadDashboard() {
    showLoading(true);
    
    // Load data
    await loadLectures();
    await loadUserPurchases();
    
    const content = document.getElementById('appContent');
    
    content.innerHTML = `
        <div class="container">
            <!-- Header -->
            <div class="app-header">
                <div class="logo">
                    <h1>🏥 JAKIREN NCLEX NURSING</h1>
                    <p>Premium NCLEX Preparation • 180 Lectures</p>
                </div>
                <div class="user-info">
                    <span class="user-name" id="userName"></span>
                    <button class="btn btn-danger" onclick="logout()">Logout</button>
                </div>
            </div>
            
            <!-- Welcome Banner -->
            <div class="welcome-banner">
                <div>
                    <h2>Welcome back, <span id="welcomeName"></span>! 👋</h2>
                    <p>Continue your NCLEX journey. You're making great progress!</p>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="stats-grid" id="statsGrid"></div>
            
            <!-- Progress -->
            <div class="progress-section">
                <div class="progress-label">Course Progress</div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="progressBar"></div>
                </div>
            </div>
            
            <!-- Featured -->
            <div class="featured-section">
                <h3>🎯 NCLEX Focus Areas</h3>
                <div class="featured-grid">
                    <div class="featured-item">📚 Pharmacology</div>
                    <div class="featured-item">💉 Medical-Surgical</div>
                    <div class="featured-item">🤰 Maternity Nursing</div>
                    <div class="featured-item">👶 Pediatric Nursing</div>
                    <div class="featured-item">🧠 Psychiatric Nursing</div>
                    <div class="featured-item">⚖️ Legal & Ethics</div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="filter-bar">
                <button class="filter-btn active" onclick="filterLectures('all')">All Lectures</button>
                <button class="filter-btn" onclick="filterLectures('unlocked')">Unlocked</button>
                <button class="filter-btn" onclick="filterLectures('locked')">Locked</button>
                <select id="monthFilter" onchange="filterByMonth()" class="month-select">
                    <option value="all">All Months</option>
                    <option value="1">Month 1: Fundamentals</option>
                    <option value="2">Month 2: Medical-Surgical</option>
                    <option value="3">Month 3: Pharmacology</option>
                    <option value="4">Month 4: Maternity & Pediatrics</option>
                    <option value="5">Month 5: Psychiatric Nursing</option>
                    <option value="6">Month 6: Final Review</option>
                </select>
            </div>
            
            <!-- Lectures Grid -->
            <div class="lectures-grid" id="lecturesGrid"></div>
        </div>
        
        <!-- Modals -->
        <div id="paymentModal" class="modal">
            <div class="modal-content">
                <span class="modal-close" onclick="closePaymentModal()">&times;</span>
                <div id="paymentModalContent"></div>
            </div>
        </div>
        
        <div id="bundleModal" class="modal">
            <div class="modal-content">
                <span class="modal-close" onclick="closeBundleModal()">&times;</span>
                <div id="bundleModalContent"></div>
            </div>
        </div>
        
        <div id="videoModal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <span class="modal-close" onclick="closeVideoModal()">&times;</span>
                <div id="videoHeader"></div>
                <div class="video-container" id="videoContainer"></div>
                <div id="videoNotes"></div>
            </div>
        </div>
    `;
    
    // Set user name
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').innerHTML = `👋 ${user.user_metadata?.full_name || user.email}`;
        document.getElementById('welcomeName').innerHTML = user.user_metadata?.full_name || user.email;
    }
    
    // Render stats and lectures
    await updateDashboardStats();
    await renderLectures();
    
    showAppContent(true);
    showLoading(false);
}

// Update dashboard stats
async function updateDashboardStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    const purchasedCount = userPurchases.length;
    const remaining = APP_CONFIG.TOTAL_LECTURES - purchasedCount;
    const progressPercent = Math.round((purchasedCount / APP_CONFIG.TOTAL_LECTURES) * 100);
    
    // Get total spent
    let totalSpent = 0;
    if (currentUser) {
        const { data } = await supabase
            .from('profiles')
            .select('total_spent')
            .eq('id', currentUser.id)
            .single();
        totalSpent = data?.total_spent || 0;
    }
    
    statsGrid.innerHTML = `
        <div class="stat-card"><div class="stat-number">${purchasedCount}</div><div class="stat-label">Lectures Unlocked</div></div>
        <div class="stat-card"><div class="stat-number">${formatCurrency(totalSpent)}</div><div class="stat-label">Total Spent</div></div>
        <div class="stat-card"><div class="stat-number">${remaining}</div><div class="stat-label">Remaining</div></div>
        <div class="stat-card"><div class="stat-number">${progressPercent}%</div><div class="stat-label">Progress</div></div>
    `;
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
    }
}
