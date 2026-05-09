// ============================================
// ADMIN PANEL - Complete Management System
// ============================================

// Use the existing supabase client from HTML
// Do NOT redeclare or re-initialize supabase here

// Global state
let currentAdmin = null;
let currentTab = 'dashboard';
let allUsers = [];
let allLectures = [];
let allSales = [];

// ========== HELPER FUNCTIONS ==========
function showToast(message, isError = false) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${isError ? '#dc3545' : '#2e8b57'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => toast.style.opacity = '0', 3500);
}

// ========== ADMIN AUTHENTICATION ==========
async function checkAdminAuth() {
    try {
        // Check if supabase is available
        if (!window.supabase) {
            console.error('Supabase not initialized');
            showToast('Error: Supabase not initialized', true);
            return false;
        }
        
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            showLoginPage();
            return false;
        }
        
        // Check database for is_admin flag
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('is_admin, role')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('Error checking admin status:', error);
            // If no profile, create one
            if (error.code === 'PGRST116') {
                await window.supabase
                    .from('profiles')
                    .insert([{ id: user.id, is_admin: false, role: 'user' }]);
                showAccessDenied();
                return false;
            }
            showAccessDenied();
            return false;
        }
        
        if (profile?.is_admin === true || profile?.role === 'admin') {
            currentAdmin = user;
            console.log('✅ Admin logged in:', user.email);
            return true;
        }
        
        showAccessDenied();
        return false;
    } catch (error) {
        console.error('Auth error:', error);
        showLoginPage();
        return false;
    }
}

function showLoginPage() {
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div class="admin-login-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a2f3f, #031f2f);">
            <div class="admin-login-card" style="background: white; border-radius: 24px; padding: 40px; width: 400px; max-width: 90%; box-shadow: 0 20px 35px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 48px;">🔐</div>
                    <h2>Admin Login</h2>
                    <p style="color: #64748b;">Enter your admin credentials</p>
                </div>
                <input type="email" id="adminEmail" placeholder="Email" style="width: 100%; padding: 12px; margin-bottom: 16px; border-radius: 10px; border: 1px solid #ddd; font-size: 14px;">
                <input type="password" id="adminPassword" placeholder="Password" style="width: 100%; padding: 12px; margin-bottom: 24px; border-radius: 10px; border: 1px solid #ddd; font-size: 14px;">
                <button onclick="adminLogin()" style="width: 100%; padding: 12px; background: #1b4f6e; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600;">
                    <i class="fas fa-sign-in-alt"></i> Login as Admin
                </button>
                <p style="text-align: center; margin-top: 16px;">
                    <a href="index.html" style="color: #64748b; text-decoration: none;">← Back to Student Dashboard</a>
                </p>
            </div>
        </div>
    `;
    appContent.style.display = 'block';
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}

function showAccessDenied() {
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background: linear-gradient(135deg, #0a2f3f, #031f2f);">
            <div style="background: white; border-radius: 24px; padding: 40px; max-width: 400px;">
                <i class="fas fa-lock" style="font-size: 64px; color: #dc3545;"></i>
                <h2 style="margin: 20px 0;">Access Denied</h2>
                <p style="color: #64748b;">You don't have permission to access the admin panel.</p>
                <button onclick="window.location.href='index.html'" style="margin-top: 20px; padding: 12px 24px; background: #1b4f6e; color: white; border: none; border-radius: 10px; cursor: pointer;">
                    Back to Home
                </button>
            </div>
        </div>
    `;
    appContent.style.display = 'block';
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}

window.adminLogin = async function() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        showToast('Please fill in all fields', true);
        return;
    }
    
    const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showToast('Login failed: ' + error.message, true);
        return;
    }
    
    showToast('Login successful!');
    setTimeout(() => location.reload(), 1000);
};

// ========== LOAD DATA ==========
async function loadAllUsers() {
    const { data } = await window.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    allUsers = data || [];
    return allUsers;
}

async function loadAllLectures() {
    const { data } = await window.supabase
        .from('lectures')
        .select('*')
        .order('lecture_number');
    allLectures = data || [];
    return allLectures;
}

async function loadAllSales() {
    const { data } = await window.supabase
        .from('user_purchases')
        .select('*, profiles!user_purchases_user_id_fkey(id, email, full_name)')
        .order('purchased_at', { ascending: false });
    allSales = data || [];
    return allSales;
}

// ========== RENDER DASHBOARD ==========
async function renderAdminDashboard() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllUsers();
    await loadAllLectures();
    await loadAllSales();
    
    const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.amount_paid || 0), 0);
    const uniqueStudents = new Set(allSales.map(s => s.user_id)).size;
    
    contentDiv.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <div class="stat-info">
                    <h3>${allUsers.length}</h3>
                    <p>Total Users</p>
                </div>
                <div class="stat-icon"><i class="fas fa-users"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>${allLectures.length}</h3>
                    <p>Total Lectures</p>
                </div>
                <div class="stat-icon"><i class="fas fa-book"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>${uniqueStudents}</h3>
                    <p>Active Students</p>
                </div>
                <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>KES ${totalRevenue.toLocaleString()}</h3>
                    <p>Total Revenue</p>
                </div>
                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
            </div>
        </div>
        
        <div class="data-table">
            <div class="table-header">
                <h3>Recent Sales</h3>
            </div>
            <table style="width: 100%;">
                <thead>
                    <tr><th>User</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                    ${allSales.slice(0, 10).map(sale => `
                        <tr>
                            <td>${sale.profiles?.email || sale.user_id || 'N/A'}</td>
                            <td>KES ${(sale.amount_paid || 0).toLocaleString()}</td>
                            <td>${new Date(sale.purchased_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                    ${allSales.length === 0 ? '<tr><td colspan="3" style="text-align: center;">No sales yet</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

// ========== INITIALIZE ADMIN PANEL ==========
async function initAdminPanel() {
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) return;
    
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div class="admin-wrapper" style="display: flex; min-height: 100vh;">
            <aside class="admin-sidebar" style="width: 280px; background: linear-gradient(180deg, #0f2b3d 0%, #1a4a63 100%); color: white;">
                <div class="admin-logo" style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 32px;">🔐</div>
                    <h2>Admin</h2>
                    <p>NCLEX Manager</p>
                </div>
                <nav class="admin-nav" style="padding: 20px 0;">
                    <div class="admin-nav-item active" data-tab="dashboard" style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; cursor: pointer;">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </div>
                    <div class="admin-nav-item" data-tab="users" style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; cursor: pointer;">
                        <i class="fas fa-users"></i>
                        <span>Users</span>
                    </div>
                    <div class="admin-nav-item" data-tab="lectures" style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; cursor: pointer;">
                        <i class="fas fa-book"></i>
                        <span>Lectures</span>
                    </div>
                </nav>
                <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button onclick="logoutAdmin()" style="width: 100%; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </aside>
            
            <main class="admin-main" style="flex: 1; padding: 24px; background: #f1f5f9;">
                <div class="admin-header" style="background: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between;">
                    <div class="page-title">
                        <h1>Admin Dashboard</h1>
                        <p style="color: #64748b;">Manage NCLEX Nursing Platform</p>
                    </div>
                    <div class="admin-user">
                        <span>${currentAdmin?.email}</span>
                    </div>
                </div>
                <div id="dynamicContent"></div>
            </main>
        </div>
    `;
    
    // Add event listeners
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', async () => {
            const tab = item.getAttribute('data-tab');
            document.querySelectorAll('.admin-nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            if (tab === 'dashboard') await renderAdminDashboard();
            else if (tab === 'users') await renderUsersManagement();
            else if (tab === 'lectures') await renderLecturesManagement();
        });
    });
    
    appContent.style.display = 'block';
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    await renderAdminDashboard();
}

window.logoutAdmin = async function() {
    await window.supabase.auth.signOut();
    location.reload();
};

// Add simple management functions
async function renderUsersManagement() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    await loadAllUsers();
    contentDiv.innerHTML = `<h3>User Management - ${allUsers.length} users</h3><pre>${JSON.stringify(allUsers, null, 2)}</pre>`;
}

async function renderLecturesManagement() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    await loadAllLectures();
    contentDiv.innerHTML = `<h3>Lecture Management - ${allLectures.length} lectures</h3><pre>${JSON.stringify(allLectures, null, 2)}</pre>`;
}

// Start the admin panel
document.addEventListener('DOMContentLoaded', initAdminPanel);
