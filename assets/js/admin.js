// ============================================
// ADMIN PANEL - Complete Management System
// ============================================

// NOTE: supabase client is already available globally from the HTML
// Do NOT redeclare it! Just use the existing 'supabase' variable.

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
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc3545' : '#2e8b57';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ========== ADMIN AUTHENTICATION ==========
async function checkAdminAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            showLoginPage();
            return false;
        }
        
        // Check database for is_admin flag
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin, role')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('Error checking admin status:', error);
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
        <div class="admin-login-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
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
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showToast('Login failed: ' + error.message, true);
        return;
    }
    
    showToast('Login successful!');
    setTimeout(() => location.reload(), 1000);
};

// ========== LOAD DATA ==========
async function loadAllUsers() {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    allUsers = data || [];
    return allUsers;
}

async function loadAllLectures() {
    const { data } = await supabase
        .from('lectures')
        .select('*')
        .order('lecture_number');
    allLectures = data || [];
    return allLectures;
}

async function loadAllSales() {
    const { data } = await supabase
        .from('user_purchases')
        .select('*, profiles(email, full_name)')
        .order('purchased_at', { ascending: false });
    allSales = data || [];
    return allSales;
}

// ========== RENDER FUNCTIONS ==========
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
        
        <div class="admin-form">
            <h3>Quick Actions</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="btn btn-primary" onclick="switchTab('lectures')"><i class="fas fa-plus"></i> Add Lecture</button>
                <button class="btn btn-success" onclick="switchTab('users')"><i class="fas fa-users"></i> Manage Users</button>
                <button class="btn btn-info" onclick="exportData()"><i class="fas fa-download"></i> Export Data</button>
            </div>
        </div>
        
        <div class="data-table">
            <div class="table-header">
                <h3>Recent Sales</h3>
            </div>
            <table style="width: 100%;">
                <thead>
                    <tr><th>User</th><th>Lecture</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                    ${allSales.slice(0, 10).map(sale => `
                        <tr>
                            <td>${sale.profiles?.email || 'N/A'}</td>
                            <td>Lecture ${sale.lecture_id}</td>
                            <td>KES ${(sale.amount_paid || 0).toLocaleString()}</td>
                            <td>${new Date(sale.purchased_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                    ${allSales.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No sales yet</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

async function renderUsersManagement() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllUsers();
    
    contentDiv.innerHTML = `
        <div class="admin-form">
            <h3>User Management</h3>
            <div class="form-row">
                <div class="form-group">
                    <input type="text" id="userSearch" placeholder="Search users..." class="form-control" onkeyup="filterUsers()">
                </div>
                <div class="form-group">
                    <select id="roleFilter" class="form-control" onchange="filterUsers()">
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="data-table">
            <table style="width: 100%;">
                <thead>
                    <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody id="usersTableBody">
                    ${allUsers.map(user => `
                        <tr>
                            <td>${user.full_name || 'N/A'}</td>
                            <td>${user.email || 'N/A'}</td>
                            <td><span class="status-badge ${user.is_admin ? 'status-active' : 'status-pending'}">${user.is_admin ? 'Admin' : 'User'}</span></td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function renderLecturesManagement() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllLectures();
    
    contentDiv.innerHTML = `
        <div class="admin-form">
            <h3>Add New Lecture</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Lecture Number</label>
                    <input type="number" id="lectureNumber" placeholder="e.g., 1">
                </div>
                <div class="form-group">
                    <label>Month</label>
                    <select id="lectureMonth">
                        <option value="1">Month 1: Fundamentals</option>
                        <option value="2">Month 2: Medical-Surgical</option>
                        <option value="3">Month 3: Pharmacology</option>
                        <option value="4">Month 4: Maternity & Pediatrics</option>
                        <option value="5">Month 5: Psychiatric Nursing</option>
                        <option value="6">Month 6: Final Review</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="lectureTitle" placeholder="Lecture title">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Price (KES)</label>
                    <input type="number" id="lecturePrice" placeholder="0">
                </div>
                <div class="form-group">
                    <label>Duration</label>
                    <input type="text" id="lectureDuration" placeholder="e.g., 2 hours">
                </div>
            </div>
            <div class="form-group">
                <label>Video URL (YouTube embed)</label>
                <input type="text" id="lectureVideoUrl" placeholder="https://www.youtube.com/embed/...">
            </div>
            <div class="form-group">
                <label>Study Notes</label>
                <textarea id="lectureNotes" rows="4" placeholder="Study notes for students..."></textarea>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="lectureIsFree"> Free Lecture</label>
            </div>
            <button class="btn btn-primary" onclick="addLecture()"><i class="fas fa-save"></i> Add Lecture</button>
        </div>
        
        <div class="data-table">
            <div class="table-header">
                <h3>All Lectures</h3>
                <div class="table-search">
                    <input type="text" id="lectureSearch" placeholder="Search lectures..." onkeyup="filterLectures()">
                </div>
            </div>
            <table style="width: 100%;">
                <thead>
                    <tr><th>#</th><th>Month</th><th>Title</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody id="lecturesTableBody">
                    ${allLectures.map(lecture => `
                        <tr>
                            <td>${lecture.lecture_number}</td>
                            <td>Month ${lecture.month}</td>
                            <td>${lecture.title}</td>
                            <td>${lecture.is_free ? 'FREE' : 'KES ' + (lecture.price || 0)}</td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editLecture(${lecture.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger" onclick="deleteLecture(${lecture.id})"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderSettings() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="admin-form">
            <h3>Platform Settings</h3>
            <div class="form-group">
                <label>Platform Name</label>
                <input type="text" id="platformName" value="Jakiren NCLEX Nursing">
            </div>
            <div class="form-group">
                <label>Contact Email</label>
                <input type="email" id="contactEmail" value="support@jakiren.com">
            </div>
            <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
        </div>
        
        <div class="admin-form">
            <h3>System Status</h3>
            <p><strong>Supabase Connection:</strong> <span class="status-badge status-active">Connected</span></p>
            <button class="btn btn-success" onclick="backupData()"><i class="fas fa-database"></i> Backup Database</button>
        </div>
    `;
}

// ========== CRUD OPERATIONS ==========
window.addLecture = async function() {
    const newLecture = {
        lecture_number: parseInt(document.getElementById('lectureNumber').value),
        month: parseInt(document.getElementById('lectureMonth').value),
        title: document.getElementById('lectureTitle').value,
        price: parseFloat(document.getElementById('lecturePrice').value) || 0,
        duration: document.getElementById('lectureDuration').value,
        video_url: document.getElementById('lectureVideoUrl').value,
        study_notes: document.getElementById('lectureNotes').value,
        is_free: document.getElementById('lectureIsFree').checked
    };
    
    if (!newLecture.title || !newLecture.lecture_number) {
        showToast('Please fill required fields', true);
        return;
    }
    
    const { error } = await supabase.from('lectures').insert([newLecture]);
    
    if (error) {
        showToast('Error: ' + error.message, true);
    } else {
        showToast('Lecture added successfully!');
        renderLecturesManagement();
    }
};

window.deleteLecture = async function(lectureId) {
    if (confirm('Are you sure you want to delete this lecture?')) {
        const { error } = await supabase.from('lectures').delete().eq('id', lectureId);
        if (error) {
            showToast('Error deleting lecture', true);
        } else {
            showToast('Lecture deleted');
            renderLecturesManagement();
        }
    }
};

window.deleteUser = async function(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) {
            showToast('Error deleting user', true);
        } else {
            showToast('User deleted');
            renderUsersManagement();
        }
    }
};

window.exportData = async function() {
    const data = {
        users: allUsers,
        lectures: allLectures,
        sales: allSales,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nclex_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Data exported successfully!');
};

window.backupData = function() {
    window.exportData();
};

window.saveSettings = function() {
    const settings = {
        platformName: document.getElementById('platformName').value,
        contactEmail: document.getElementById('contactEmail').value
    };
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    showToast('Settings saved!');
};

// ========== FILTERS ==========
window.filterUsers = function() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';
    
    const filtered = allUsers.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(searchTerm) || 
                             user.full_name?.toLowerCase().includes(searchTerm);
        const matchesRole = roleFilter === 'all' || 
                           (roleFilter === 'admin' && user.is_admin) ||
                           (roleFilter === 'user' && !user.is_admin);
        return matchesSearch && matchesRole;
    });
    
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(user => `
            <tr>
                <td>${user.full_name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td><span class="status-badge ${user.is_admin ? 'status-active' : 'status-pending'}">${user.is_admin ? 'Admin' : 'User'}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    }
};

window.filterLectures = function() {
    const searchTerm = document.getElementById('lectureSearch')?.value.toLowerCase() || '';
    
    const filtered = allLectures.filter(lecture => 
        lecture.title.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('lecturesTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(lecture => `
            <tr>
                <td>${lecture.lecture_number}</td>
                <td>Month ${lecture.month}</td>
                <td>${lecture.title}</td>
                <td>${lecture.is_free ? 'FREE' : 'KES ' + (lecture.price || 0)}</td>
                <td><span class="status-badge status-active">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editLecture(${lecture.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteLecture(${lecture.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
};

// ========== NAVIGATION ==========
window.switchTab = async function(tab) {
    currentTab = tab;
    
    // Update active state in sidebar
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) {
            item.classList.add('active');
        }
    });
    
    // Render selected tab
    switch(tab) {
        case 'dashboard':
            await renderAdminDashboard();
            break;
        case 'users':
            await renderUsersManagement();
            break;
        case 'lectures':
            await renderLecturesManagement();
            break;
        case 'settings':
            renderSettings();
            break;
    }
};

window.logoutAdmin = async function() {
    await supabase.auth.signOut();
    location.reload();
};

// ========== INITIALIZE ADMIN PANEL ==========
async function initAdminPanel() {
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) return;
    
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div class="admin-wrapper">
            <aside class="admin-sidebar">
                <div class="admin-logo">
                    <div style="font-size: 32px;">🔐</div>
                    <h2>Admin</h2>
                    <p>NCLEX Manager</p>
                </div>
                <nav class="admin-nav">
                    <div class="admin-nav-item active" data-tab="dashboard">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </div>
                    <div class="admin-nav-item" data-tab="users">
                        <i class="fas fa-users"></i>
                        <span>Users</span>
                    </div>
                    <div class="admin-nav-item" data-tab="lectures">
                        <i class="fas fa-book"></i>
                        <span>Lectures</span>
                    </div>
                    <div class="admin-nav-item" data-tab="settings">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </div>
                </nav>
                <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button class="btn btn-danger" style="width: 100%;" onclick="logoutAdmin()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </aside>
            
            <main class="admin-main">
                <div class="admin-header">
                    <div class="page-title">
                        <h1>Admin Dashboard</h1>
                        <p>Manage NCLEX Nursing Platform</p>
                    </div>
                    <div class="admin-user">
                        <span>${currentAdmin?.email}</span>
                        <div class="admin-avatar">A</div>
                    </div>
                </div>
                <div id="dynamicContent"></div>
            </main>
        </div>
    `;
    
    // Add event listeners to nav items
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    appContent.style.display = 'block';
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    // Load dashboard
    await renderAdminDashboard();
}

// Start admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', initAdminPanel);
