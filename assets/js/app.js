// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================

// Global state
let currentUser = null;

// Initialize app 
async function initApp() {
    console.log('🚀 Starting Jakiren NCLEX Nursing App');
    
    // Check if user is logged in
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        console.log('✅ User logged in, loading dashboard');
        await loadDashboard();
    } else {
        console.log('❌ No user, showing login page');
        await loadLoginPage();
    }
    
    // Hide loading screen
    setTimeout(() => {
        showLoading(false);
    }, 500);
}

// Load the main dashboard UI
async function loadDashboard() {
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    // Get current user info
    currentUser = await getCurrentUser();
    const displayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Nurse';
    
    // Inject dashboard HTML
    appContent.innerHTML = `
        <div class="app-wrapper">
            <!-- Sidebar Navigation -->
            <aside class="sidebar">
                <div class="sidebar-brand">
                    <div class="brand-icon">🏥</div>
                    <div class="brand-text">
                        <h2>Jakiren</h2>
                        <span>NCLEX Nursing</span>
                    </div>
                </div>
                
                <nav class="sidebar-nav">
                    <a href="#" class="nav-item active" data-tab="dashboard">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="lectures">
                        <i class="fas fa-book-open"></i>
                        <span>My Lectures</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="progress">
                        <i class="fas fa-chart-line"></i>
                        <span>Progress</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="certificates">
                        <i class="fas fa-certificate"></i>
                        <span>Certificates</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="support">
                        <i class="fas fa-headset"></i>
                        <span>Support</span>
                    </a>
                </nav>
                
                <div class="sidebar-footer">
                    <div class="user-profile-mini">
                        <div class="user-avatar" id="userAvatar">${displayName.charAt(0).toUpperCase()}</div>
                        <div class="user-info-mini">
                            <span id="sidebarUserName">${displayName}</span>
                            <small>NCLEX Candidate</small>
                        </div>
                    </div>
                    <button class="btn-logout" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <!-- Main Content Area -->
            <main class="main-content">
                <div class="top-bar">
                    <div class="page-title">
                        <h1 id="pageMainTitle"><i class="fas fa-graduation-cap"></i> Nursing Dashboard</h1>
                        <p id="pageSubtitle">Track your NCLEX journey to success</p>
                    </div>
                    <div class="top-actions">
                        <div class="notification-badge">
                            <i class="fas fa-bell"></i>
                            <span class="badge-dot"></span>
                        </div>
                        <div class="user-greeting">
                            Welcome, <strong id="welcomeNameShort">${displayName}</strong>
                        </div>
                    </div>
                </div>

                <!-- Dynamic Content Container -->
                <div id="dynamicContent">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-pulse"></i> Loading dashboard...
                    </div>
                </div>
            </main>
        </div>
    `;
    
    // Show the content
    appContent.style.display = 'block';
    
    // Load data
    await loadLecturesData();
    await loadUserPurchasesData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await signOut();
            window.location.reload();
        };
    }
    
    // Load initial view (dashboard)
    await renderDashboardView();
}

// Load login page
async function loadLoginPage() {
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div class="auth-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary-dark), var(--primary));">
            <div class="auth-card">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div class="brand-icon" style="font-size: 48px;">🏥</div>
                    <h1 style="margin-top: 16px;">Jakiren NCLEX Nursing</h1>
                    <p style="color: var(--gray);">Premium NCLEX Preparation</p>
                </div>
                
                <div class="tabs">
                    <button class="tab-btn active" onclick="switchTab('login')">Login</button>
                    <button class="tab-btn" onclick="switchTab('register')">Register</button>
                </div>
                
                <div id="loginTab" class="tab-content active">
                    <input type="email" id="loginEmail" class="auth-input" placeholder="Email address" autocomplete="email">
                    <input type="password" id="loginPassword" class="auth-input" placeholder="Password" autocomplete="current-password">
                    <button class="btn btn-primary" style="width: 100%;" onclick="handleLogin()">Login →</button>
                </div>
                
                <div id="registerTab" class="tab-content">
                    <input type="text" id="regName" class="auth-input" placeholder="Full Name">
                    <input type="email" id="regEmail" class="auth-input" placeholder="Email address">
                    <input type="password" id="regPassword" class="auth-input" placeholder="Password (min 6 characters)">
                    <button class="btn btn-primary" style="width: 100%;" onclick="handleRegister()">Create Account →</button>
                </div>
            </div>
        </div>
    `;
    
    appContent.style.display = 'block';
    
    // Expose auth functions to window
    window.switchTab = function(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        if (tab === 'login') {
            document.querySelector('.tab-btn').classList.add('active');
            document.getElementById('loginTab').classList.add('active');
        } else {
            document.querySelectorAll('.tab-btn')[1].classList.add('active');
            document.getElementById('registerTab').classList.add('active');
        }
    };
    
    window.handleLogin = async function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showToast('Please fill in all fields', true);
            return;
        }
        
        const result = await signIn(email, password);
        if (result.success) {
            showToast('Login successful!');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.error || 'Login failed', true);
        }
    };
    
    window.handleRegister = async function() {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        if (!name || !email || !password) {
            showToast('Please fill in all fields', true);
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', true);
            return;
        }
        
        const result = await signUp(email, password, { full_name: name });
        if (result.success) {
            showToast('Account created! Please check your email to confirm.');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showToast(result.error || 'Registration failed', true);
        }
    };
}

// Load lectures data
async function loadLecturesData() {
    try {
        const { data, error } = await supabase
            .from('lectures')
            .select('*')
            .order('lecture_number', { ascending: true });
        
        if (error) throw error;
        window.allLectures = data || [];
        return window.allLectures;
    } catch (error) {
        console.error('Error loading lectures:', error);
        window.allLectures = [];
        return [];
    }
}

// Load user purchases data
async function loadUserPurchasesData() {
    const user = await getCurrentUser();
    if (!user) {
        window.userPurchases = [];
        return [];
    }
    
    try {
        const { data, error } = await supabase
            .from('user_purchases')
            .select('lecture_id')
            .eq('user_id', user.id);
        
        if (error) throw error;
        window.userPurchases = data?.map(p => p.lecture_id) || [];
        return window.userPurchases;
    } catch (error) {
        console.error('Error loading purchases:', error);
        window.userPurchases = [];
        return [];
    }
}

// Setup navigation handlers
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update page title
            updatePageTitle(tab);
            
            // Render view based on tab
            switch(tab) {
                case 'dashboard':
                    await renderDashboardView();
                    break;
                case 'lectures':
                    await renderLecturesView();
                    break;
                case 'progress':
                    await renderProgressView();
                    break;
                case 'certificates':
                    await renderCertificatesView();
                    break;
                case 'support':
                    await renderSupportView();
                    break;
            }
        });
    });
}

// Update page title based on tab
function updatePageTitle(tab) {
    const titles = {
        dashboard: { title: 'Nursing Dashboard', subtitle: 'Track your NCLEX journey to success', icon: 'fa-graduation-cap' },
        lectures: { title: 'My Lectures', subtitle: 'Access all your NCLEX course materials', icon: 'fa-book-open' },
        progress: { title: 'Progress Tracker', subtitle: 'Monitor your NCLEX preparation progress', icon: 'fa-chart-line' },
        certificates: { title: 'Certificates', subtitle: 'View and download your achievements', icon: 'fa-certificate' },
        support: { title: 'Support Center', subtitle: 'Get help with your NCLEX preparation', icon: 'fa-headset' }
    };
    
    const titleData = titles[tab];
    const titleEl = document.getElementById('pageMainTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    
    if (titleEl) titleEl.innerHTML = `<i class="fas ${titleData.icon}"></i> ${titleData.title}`;
    if (subtitleEl) subtitleEl.textContent = titleData.subtitle;
}

// Render Dashboard View
async function renderDashboardView() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    const user = await getCurrentUser();
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Nurse';
    const purchasedCount = window.userPurchases?.length || 0;
    const totalLectures = window.allLectures?.length || 180;
    const percentComplete = Math.round((purchasedCount / totalLectures) * 100);
    
    contentDiv.innerHTML = `
        <div class="welcome-banner">
            <div class="welcome-text">
                <h2>Welcome back, <span id="welcomeName">${displayName}</span>! 👋</h2>
                <p>Continue your NCLEX journey. You're making great progress toward becoming a registered nurse!</p>
                <div class="motivation-tag">⭐ ${totalLectures} Lectures • 6 Months Premium Access</div>
            </div>
            <div class="streak-badge">
                <i class="fas fa-calendar-week"></i>
                <div class="streak-number">🔥</div>
                <small>NCLEX Ready</small>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-lock-open"></i></div>
                <div class="stat-number" id="statPurchased">${purchasedCount}</div>
                <div class="stat-label">Lectures Unlocked</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-coins"></i></div>
                <div class="stat-number" id="statSpent">KES 0</div>
                <div class="stat-label">Total Investment</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-hourglass-half"></i></div>
                <div class="stat-number" id="statRemaining">${totalLectures - purchasedCount}</div>
                <div class="stat-label">Remaining Lectures</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-chart-line"></i></div>
                <div class="stat-number" id="statPercent">${percentComplete}%</div>
                <div class="stat-label">Overall Progress</div>
            </div>
        </div>

        <div class="progress-section">
            <div class="progress-header">
                <div class="progress-label"><i class="fas fa-chart-simple"></i> Course Completion Tracker</div>
                <div class="progress-value" id="progressPercentLabel">${percentComplete}% Complete</div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" id="progressBarFill" style="width: ${percentComplete}%;"></div>
            </div>
            <div class="progress-details">
                <span id="progressDetailText">${getMotivationalMessage(percentComplete)}</span>
            </div>
        </div>

        <div class="featured-section">
            <h3><i class="fas fa-bullseye"></i> NCLEX Exam Focus Areas</h3>
            <div class="featured-grid">
                <div class="featured-item"><i class="fas fa-capsules"></i> Pharmacology</div>
                <div class="featured-item"><i class="fas fa-stethoscope"></i> Medical-Surgical</div>
                <div class="featured-item"><i class="fas fa-baby-carriage"></i> Maternity Nursing</div>
                <div class="featured-item"><i class="fas fa-child"></i> Pediatric Nursing</div>
                <div class="featured-item"><i class="fas fa-brain"></i> Psychiatric Nursing</div>
                <div class="featured-item"><i class="fas fa-gavel"></i> Legal & Ethics</div>
                <div class="featured-item"><i class="fas fa-lungs"></i> Respiratory</div>
                <div class="featured-item"><i class="fas fa-heartbeat"></i> Cardiovascular</div>
            </div>
        </div>
    `;
    
    // Update stats from database
    await updateDashboardStats();
}

// Render Lectures View
async function renderLecturesView() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="filter-bar">
            <div class="filter-buttons">
                <button class="filter-btn active" data-filter="all"><i class="fas fa-list"></i> All</button>
                <button class="filter-btn" data-filter="unlocked"><i class="fas fa-check-circle"></i> Unlocked</button>
                <button class="filter-btn" data-filter="locked"><i class="fas fa-lock"></i> Locked</button>
            </div>
            <select id="monthFilter" class="month-select">
                <option value="all">📅 All Months</option>
                <option value="1">📘 Month 1: Fundamentals</option>
                <option value="2">💉 Month 2: Medical-Surgical</option>
                <option value="3">💊 Month 3: Pharmacology</option>
                <option value="4">🤰 Month 4: Maternity & Pediatrics</option>
                <option value="5">🧠 Month 5: Psychiatric Nursing</option>
                <option value="6">⭐ Month 6: Final Review</option>
            </select>
        </div>
        <div class="lectures-grid" id="lecturesGrid">
            <div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading lectures...</div>
        </div>
    `;
    
    await renderLecturesGrid();
    
    // Setup filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.currentFilter = filter;
            renderLecturesGrid();
        };
    });
    
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        monthFilter.onchange = () => {
            window.currentMonth = monthFilter.value;
            renderLecturesGrid();
        };
    }
}

// Render Lectures Grid
async function renderLecturesGrid() {
    const grid = document.getElementById('lecturesGrid');
    if (!grid) return;
    
    const allLectures = window.allLectures || [];
    const userPurchases = window.userPurchases || [];
    const currentFilter = window.currentFilter || 'all';
    const currentMonth = window.currentMonth || 'all';
    
    let filtered = [...allLectures];
    
    if (currentMonth !== 'all') {
        filtered = filtered.filter(l => l.month === parseInt(currentMonth));
    }
    if (currentFilter === 'unlocked') {
        filtered = filtered.filter(l => userPurchases.includes(l.id));
    } else if (currentFilter === 'locked') {
        filtered = filtered.filter(l => !userPurchases.includes(l.id) && !l.is_free);
    }
    
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No lectures found</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(lecture => {
        const isPurchased = userPurchases.includes(lecture.id);
        const canAccess = isPurchased || lecture.is_free;
        
        let badge = '';
        if (lecture.is_free) badge = '<span class="badge badge-free">🎁 FREE</span>';
        else if (isPurchased) badge = '<span class="badge badge-unlocked">✅ UNLOCKED</span>';
        else badge = '<span class="badge badge-locked">🔒 LOCKED</span>';
        
        let priceHtml = '';
        if (!lecture.is_free && !isPurchased) {
            priceHtml = `<div class="lecture-price">KES ${lecture.price?.toLocaleString() || 0}</div>`;
        }
        
        return `
            <div class="lecture-card ${!canAccess ? 'locked' : ''}">
                ${badge}
                <div class="lecture-number">Lecture ${lecture.lecture_number} • ${getMonthName(lecture.month)}</div>
                <div class="lecture-title">${lecture.title}</div>
                <div class="lecture-duration"><i class="far fa-clock"></i> ${lecture.duration || '2 hours'}</div>
                ${priceHtml}
                ${canAccess ? 
                    `<button class="watch-btn" onclick="window.watchLecture(${lecture.id})"><i class="fas fa-play"></i> Watch Lecture</button>` : 
                    `<button class="unlock-btn" onclick='window.initiateUnlock(${JSON.stringify(lecture).replace(/'/g, "&#39;")})'><i class="fas fa-key"></i> Unlock KES ${lecture.price?.toLocaleString() || 0}</button>`
                }
            </div>
        `;
    }).join('');
}

// Render Progress View
async function renderProgressView() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    const purchasedCount = window.userPurchases?.length || 0;
    const totalLectures = window.allLectures?.length || 180;
    const percentComplete = Math.round((purchasedCount / totalLectures) * 100);
    
    // Calculate progress by month
    let monthsHtml = '';
    for (let i = 1; i <= 6; i++) {
        const monthLectures = (window.allLectures || []).filter(l => l.month === i);
        const monthUnlocked = monthLectures.filter(l => window.userPurchases?.includes(l.id)).length;
        const monthPercent = monthLectures.length > 0 ? Math.round((monthUnlocked / monthLectures.length) * 100) : 0;
        monthsHtml += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span><strong>${getMonthName(i)}</strong></span>
                    <span>${monthUnlocked}/${monthLectures.length} lectures (${monthPercent}%)</span>
                </div>
                <div class="progress-bar-container" style="height: 10px;">
                    <div class="progress-bar-fill" style="width: ${monthPercent}%; height: 100%;"></div>
                </div>
            </div>
        `;
    }
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px;">
            <h2><i class="fas fa-chart-line"></i> Your NCLEX Progress</h2>
            <div style="margin: 20px 0 10px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Overall Course Completion</span>
                    <span>${percentComplete}%</span>
                </div>
                <div class="progress-bar-container" style="height: 20px; margin-top: 8px;">
                    <div class="progress-bar-fill" style="width: ${percentComplete}%; height: 100%;"></div>
                </div>
            </div>
            <p style="color: var(--gray);">
                <i class="fas fa-check-circle" style="color: var(--success);"></i> 
                ${purchasedCount} of ${totalLectures} lectures completed
            </p>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-clock"></i></div>
                <div class="stat-number">${Math.floor(purchasedCount * 2)} hrs</div>
                <div class="stat-label">Study Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-fire"></i></div>
                <div class="stat-number">${Math.floor(percentComplete / 10)}</div>
                <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-trophy"></i></div>
                <div class="stat-number">${Math.floor(percentComplete / 20)}</div>
                <div class="stat-label">Achievements</div>
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px;">
            <h3><i class="fas fa-chart-simple"></i> Progress by Month</h3>
            <div style="margin-top: 20px;">${monthsHtml}</div>
        </div>
    `;
}

// Render Certificates View
async function renderCertificatesView() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    const purchasedCount = window.userPurchases?.length || 0;
    const totalLectures = window.allLectures?.length || 180;
    const percentComplete = Math.round((purchasedCount / totalLectures) * 100);
    const isComplete = percentComplete === 100;
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px; text-align: center;">
            <i class="fas fa-certificate" style="font-size: 64px; color: var(--primary); margin-bottom: 16px;"></i>
            <h2>Your Achievement Certificates</h2>
            <p style="color: var(--gray);">Complete milestones to earn certificates and badges</p>
        </div>
        
        ${isComplete ? `
            <div style="background: linear-gradient(135deg, var(--success), var(--success-light)); border-radius: 24px; padding: 32px; margin-bottom: 24px; text-align: center; color: white;">
                <i class="fas fa-trophy" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h2 style="color: white;">🎉 NCLEX Master Certificate 🎉</h2>
                <p>Congratulations! You've completed all ${totalLectures} lectures!</p>
                <button class="btn btn-primary" style="margin-top: 16px; background: white; color: var(--success);" onclick="downloadCertificate()">
                    <i class="fas fa-download"></i> Download Certificate
                </button>
            </div>
        ` : `
            <div style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: 24px; padding: 28px; margin-bottom: 24px; color: white;">
                <h3>Progress to Certificate</h3>
                <div class="progress-bar-container" style="margin: 16px 0;">
                    <div class="progress-bar-fill" style="width: ${percentComplete}%;"></div>
                </div>
                <p>Complete ${totalLectures - purchasedCount} more lectures to earn your NCLEX Master Certificate!</p>
            </div>
        `}
    `;
}

// Render Support View
async function renderSupportView() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 32px; margin-bottom: 24px; text-align: center;">
            <i class="fas fa-headset" style="font-size: 64px; color: var(--primary); margin-bottom: 16px;"></i>
            <h2>Support Center</h2>
            <p style="color: var(--gray);">We're here to help you succeed in your NCLEX journey</p>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card" style="cursor: pointer;" onclick="window.location.href='mailto:support@jakiren.com'">
                <i class="fas fa-envelope" style="font-size: 32px; color: var(--primary);"></i>
                <div class="stat-label">Email Support</div>
                <small>support@jakiren.com</small>
            </div>
            <div class="stat-card" style="cursor: pointer;" onclick="window.open('https://wa.me/254700000000')">
                <i class="fab fa-whatsapp" style="font-size: 32px; color: #25D366;"></i>
                <div class="stat-label">WhatsApp</div>
                <small>+254 700 000 000</small>
            </div>
            <div class="stat-card" style="cursor: pointer;" onclick="window.location.href='tel:+254700000000'">
                <i class="fas fa-phone" style="font-size: 32px; color: var(--primary);"></i>
                <div class="stat-label">Call Us</div>
                <small>+254 700 000 000</small>
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px;">
            <h3><i class="fas fa-question-circle"></i> Frequently Asked Questions</h3>
            ${getFAQs().map((faq, i) => `
                <div style="border-bottom: 1px solid var(--light-gray); padding: 16px 0;">
                    <strong><i class="fas fa-question-circle" style="color: var(--primary); margin-right: 10px;"></i> ${faq.q}</strong>
                    <p style="margin-top: 8px; color: var(--gray);">${faq.a}</p>
                </div>
            `).join('')}
        </div>
    `;
}
// ========== THEME TOGGLE ==========
function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Add theme toggle button to top bar
    const topActions = document.querySelector('.top-actions');
    if (topActions && !document.querySelector('.theme-toggle')) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeBtn.onclick = () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeBtn.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            showToast(`${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`);
        };
        topActions.insertBefore(themeBtn, topActions.firstChild);
    }
}

// ========== STUDY TIMER ==========
let timerInterval = null;
let timerSeconds = 25 * 60;

function renderStudyTimer() {
    return `
        <div class="study-timer">
            <h3><i class="fas fa-hourglass-half"></i> Study Timer</h3>
            <div class="timer-display" id="timerDisplay">25:00</div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-primary" onclick="startStudyTimer()"><i class="fas fa-play"></i> Start</button>
                <button class="btn btn-warning" onclick="pauseStudyTimer()"><i class="fas fa-pause"></i> Pause</button>
                <button class="btn btn-danger" onclick="resetStudyTimer()"><i class="fas fa-stop"></i> Reset</button>
            </div>
            <p style="margin-top: 12px; color: var(--gray); font-size: 12px;">25 min focused study session</p>
        </div>
    `;
}

window.startStudyTimer = function() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            showToast('🎉 Study session complete! Take a 5-minute break!');
            playNotificationSound();
            // Auto-reset to 25:00
            timerSeconds = 25 * 60;
            updateTimerDisplay();
        } else {
            timerSeconds--;
            updateTimerDisplay();
        }
    }, 1000);
};

window.pauseStudyTimer = function() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        showToast('⏸️ Timer paused');
    }
};

window.resetStudyTimer = function() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerSeconds = 25 * 60;
    updateTimerDisplay();
    showToast('🔄 Timer reset to 25:00');
};

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.2;
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, 500);
    } catch(e) { console.log('Sound not supported'); }
}

// ========== KEYBOARD SHORTCUTS ==========
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + D -> Dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            document.querySelector('[data-tab="dashboard"]')?.click();
            showToast('📊 Dashboard (Ctrl+D)');
        }
        // Ctrl/Cmd + L -> Lectures
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            document.querySelector('[data-tab="lectures"]')?.click();
            showToast('📚 Lectures (Ctrl+L)');
        }
        // Ctrl/Cmd + P -> Progress
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            document.querySelector('[data-tab="progress"]')?.click();
            showToast('📈 Progress (Ctrl+P)');
        }
        // Ctrl/Cmd + C -> Certificates
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            document.querySelector('[data-tab="certificates"]')?.click();
            showToast('🏆 Certificates (Ctrl+C)');
        }
        // Esc -> Close any open modal
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                    showToast('Modal closed');
                }
            });
        }
        // ? -> Show shortcuts help
        if (e.key === '?') {
            showShortcutsHelp();
        }
    });
}

function showShortcutsHelp() {
    const shortcuts = `
        ⌨️ Keyboard Shortcuts:
        • Ctrl/Cmd + D → Dashboard
        • Ctrl/Cmd + L → My Lectures
        • Ctrl/Cmd + P → Progress
        • Ctrl/Cmd + C → Certificates
        • ESC → Close modal
        • ? → Show this help
    `;
    alert(shortcuts);
}

// ========== STUDY STREAK TRACKING ==========
async function updateStudyStreak() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const today = new Date().toDateString();
    const lastStudyKey = `last_study_${user.id}`;
    const streakKey = `streak_${user.id}`;
    const lastStudy = localStorage.getItem(lastStudyKey);
    
    if (lastStudy !== today) {
        let streak = parseInt(localStorage.getItem(streakKey) || '0');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastStudy === yesterday.toDateString()) {
            streak++;
        } else if (lastStudy !== today) {
            streak = 1;
        }
        
        localStorage.setItem(streakKey, streak.toString());
        localStorage.setItem(lastStudyKey, today);
        
        // Show motivational message
        if (streak === 7) {
            showToast('🔥 7-day streak! You\'re on fire!');
        } else if (streak === 30) {
            showToast('🏆 Amazing! 30-day streak!');
        }
    }
}

// Call this when user watches a lecture
window.recordStudyActivity = async function() {
    await updateStudyStreak();
};
// Helper Functions
function getMonthName(month) {
    const months = {
        1: '📘 Fundamentals',
        2: '💉 Medical-Surgical',
        3: '💊 Pharmacology',
        4: '🤰 Maternity & Pediatrics',
        5: '🧠 Psychiatric Nursing',
        6: '⭐ Final Review'
    };
    return months[month] || `Month ${month}`;
}

function getMotivationalMessage(percent) {
    if (percent === 100) return '🏆 Amazing! You\'ve completed the entire NCLEX course! Ready for the exam!';
    if (percent > 50) return '🔥 Excellent progress! You\'re more than halfway there!';
    if (percent > 0) return '📚 Keep going! Every lecture brings you closer to becoming an RN.';
    return '🎯 Start your NCLEX journey today!';
}

function getFAQs() {
    return [
        { q: "How do I access purchased lectures?", a: "After purchase, lectures are automatically unlocked. Click 'My Lectures' in the sidebar to see all unlocked lectures." },
        { q: "How long do I have access to lectures?", a: "Lifetime access! Once you purchase a lecture or bundle, you have unlimited access forever." },
        { q: "What payment methods are accepted?", a: "We accept M-Pesa (STK Push), Credit/Debit Cards, and PayPal. All payments are secure." },
        { q: "Can I get a refund?", a: "We offer a 7-day money-back guarantee for bundle purchases. Individual lectures are non-refundable once accessed." },
        { q: "How do I get my certificate?", a: "Complete all 180 lectures to unlock the NCLEX Master Certificate from the Certificates tab." }
    ];
}

async function updateDashboardStats() {
    const user = await getCurrentUser();
    if (!user) return;
    
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_spent')
            .eq('id', user.id)
            .single();
        
        const spentEl = document.getElementById('statSpent');
        if (spentEl) spentEl.innerHTML = `KES ${profile?.total_spent?.toLocaleString() || 0}`;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Global functions for buttons
window.watchLecture = async function(lectureId) {
    const lecture = (window.allLectures || []).find(l => l.id === lectureId);
    if (!lecture) return;
    
    const userPurchases = window.userPurchases || [];
    if (!userPurchases.includes(lecture.id) && !lecture.is_free) {
        showToast('Please purchase this lecture first', true);
        return;
    }
    
    // Open video modal (simplified)
    alert(`Playing: ${lecture.title}\n\nVideo URL: ${lecture.video_url || 'Video coming soon'}`);
};

window.initiateUnlock = async function(lecture) {
    showToast(`Unlock ${lecture.title} for KES ${lecture.price} - Payment integration coming soon`);
};

window.downloadCertificate = function() {
    const user = getCurrentUser();
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'NCLEX Candidate';
    alert(`Certificate for ${displayName}\n\nComplete the NCLEX course to download your certificate.`);
};

// Start the app
document.addEventListener('DOMContentLoaded', initApp);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registered:', registration.scope);
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}
