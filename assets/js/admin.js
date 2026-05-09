// ============================================
// ADMIN PANEL - COMPLETE MANAGEMENT SYSTEM
// ============================================

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
            font-family: 'Inter', sans-serif;
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
        
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('is_admin, role')
            .eq('id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') {
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
    const { data, error } = await window.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading users:', error);
        return [];
    }
    allUsers = data || [];
    return allUsers;
}

async function loadAllLectures() {
    const { data, error } = await window.supabase
        .from('lectures')
        .select('*')
        .order('lecture_number', { ascending: true });
    
    if (error) {
        console.error('Error loading lectures:', error);
        return [];
    }
    allLectures = data || [];
    return allLectures;
}

async function loadAllSales() {
    const { data, error } = await window.supabase
        .from('user_purchases')
        .select('*, profiles!user_purchases_user_id_fkey(id, email, full_name)')
        .order('purchased_at', { ascending: false });
    
    if (error) {
        console.error('Error loading sales:', error);
        return [];
    }
    allSales = data || [];
    return allSales;
}

// ========== RENDER DASHBOARD ==========
async function renderDashboard() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllUsers();
    await loadAllLectures();
    await loadAllSales();
    
    const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.amount_paid || 0), 0);
    const uniqueStudents = new Set(allSales.map(s => s.user_id)).size;
    const totalPurchases = allSales.length;
    
    contentDiv.innerHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px;">
            <div class="stat-card" style="background: white; border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 32px;">${allUsers.length}</h3><p>Total Users</p></div>
                <i class="fas fa-users" style="font-size: 40px; color: #1b4f6e;"></i>
            </div>
            <div class="stat-card" style="background: white; border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 32px;">${allLectures.length}</h3><p>Total Lectures</p></div>
                <i class="fas fa-book" style="font-size: 40px; color: #1b4f6e;"></i>
            </div>
            <div class="stat-card" style="background: white; border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 32px;">${uniqueStudents}</h3><p>Active Students</p></div>
                <i class="fas fa-user-graduate" style="font-size: 40px; color: #1b4f6e;"></i>
            </div>
            <div class="stat-card" style="background: white; border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 32px;">KES ${totalRevenue.toLocaleString()}</h3><p>Total Revenue</p></div>
                <i class="fas fa-chart-line" style="font-size: 40px; color: #1b4f6e;"></i>
            </div>
            <div class="stat-card" style="background: white; border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 32px;">${totalPurchases}</h3><p>Total Purchases</p></div>
                <i class="fas fa-shopping-cart" style="font-size: 40px; color: #1b4f6e;"></i>
            </div>
        </div>
        
        <div class="quick-actions" style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
            <h3>Quick Actions</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="btn btn-primary" onclick="switchTab('addLecture')" style="padding: 10px 20px; background: #1b4f6e; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Add Lecture
                </button>
                <button class="btn btn-success" onclick="switchTab('users')" style="padding: 10px 20px; background: #2e8b57; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-users"></i> Manage Users
                </button>
                <button class="btn btn-info" onclick="exportAllData()" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-download"></i> Export Data
                </button>
            </div>
        </div>
        
        <div class="data-table" style="background: white; border-radius: 20px; overflow: hidden;">
            <div class="table-header" style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <h3>Recent Sales</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f1f5f9;">
                    <tr><th style="padding: 12px 16px; text-align: left;">User</th><th style="padding: 12px 16px; text-align: left;">Amount</th><th style="padding: 12px 16px; text-align: left;">Date</th></tr>
                </thead>
                <tbody>
                    ${allSales.slice(0, 10).map(sale => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px;">${sale.profiles?.email || sale.user_id?.slice(0, 8) || 'N/A'}</td>
                            <td style="padding: 12px 16px;">KES ${(sale.amount_paid || 0).toLocaleString()}</td>
                            <td style="padding: 12px 16px;">${new Date(sale.purchased_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                    ${allSales.length === 0 ? '<tr><td colspan="3" style="padding: 40px; text-align: center;">No sales yet</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

// ========== RENDER USERS MANAGEMENT ==========
async function renderUsersManagement() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllUsers();
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
            <h3>User Management</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                <input type="text" id="userSearch" placeholder="🔍 Search users..." onkeyup="filterUsers()" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <select id="roleFilter" onchange="filterUsers()" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                </select>
            </div>
        </div>
        
        <div class="data-table" style="background: white; border-radius: 20px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f1f5f9;">
                    <tr>
                        <th style="padding: 12px 16px; text-align: left;">Name</th>
                        <th style="padding: 12px 16px; text-align: left;">Email</th>
                        <th style="padding: 12px 16px; text-align: left;">Role</th>
                        <th style="padding: 12px 16px; text-align: left;">Joined</th>
                        <th style="padding: 12px 16px; text-align: left;">Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    ${allUsers.map(user => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px;">${user.full_name || 'N/A'}</td>
                            <td style="padding: 12px 16px;">${user.email || 'N/A'}</td>
                            <td style="padding: 12px 16px;"><span style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; background: ${user.is_admin ? '#e8f5e9' : '#fff3e0'}; color: ${user.is_admin ? '#2e8b57' : '#f59e0b'};">${user.is_admin ? 'Admin' : 'User'}</span></td>
                            <td style="padding: 12px 16px;">${new Date(user.created_at).toLocaleDateString()}</td>
                            <td style="padding: 12px 16px;">
                                <button onclick="toggleAdminRole('${user.id}', ${!user.is_admin})" style="padding: 6px 12px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">
                                    ${user.is_admin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                                <button onclick="deleteUser('${user.id}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ========== RENDER LECTURES MANAGEMENT ==========
async function renderLecturesManagement() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllLectures();
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
            <h3>Add New Lecture</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
                <input type="number" id="lectureNumber" placeholder="Lecture Number" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <select id="lectureMonth" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <option value="1">Month 1: Fundamentals</option>
                    <option value="2">Month 2: Medical-Surgical</option>
                    <option value="3">Month 3: Pharmacology</option>
                    <option value="4">Month 4: Maternity & Pediatrics</option>
                    <option value="5">Month 5: Psychiatric Nursing</option>
                    <option value="6">Month 6: Final Review</option>
                </select>
                <input type="text" id="lectureTitle" placeholder="Lecture Title" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <input type="number" id="lecturePrice" placeholder="Price (KES)" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <input type="text" id="lectureDuration" placeholder="Duration (e.g., 2 hours)" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <input type="text" id="lectureVideoUrl" placeholder="YouTube Video URL" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
            </div>
            <textarea id="lectureNotes" rows="3" placeholder="Study Notes" style="width: 100%; padding: 10px; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px;"></textarea>
            <div style="margin-top: 16px;">
                <label><input type="checkbox" id="lectureIsFree"> Free Lecture</label>
            </div>
            <button onclick="addLecture()" style="margin-top: 16px; padding: 10px 20px; background: #2e8b57; color: white; border: none; border-radius: 8px; cursor: pointer;">
                <i class="fas fa-save"></i> Add Lecture
            </button>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
            <input type="text" id="lectureSearch" placeholder="🔍 Search lectures..." onkeyup="filterLectures()" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
        </div>
        
        <div class="data-table" style="background: white; border-radius: 20px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f1f5f9;">
                    <tr>
                        <th style="padding: 12px 16px; text-align: left;">#</th>
                        <th style="padding: 12px 16px; text-align: left;">Month</th>
                        <th style="padding: 12px 16px; text-align: left;">Title</th>
                        <th style="padding: 12px 16px; text-align: left;">Price</th>
                        <th style="padding: 12px 16px; text-align: left;">Duration</th>
                        <th style="padding: 12px 16px; text-align: left;">Actions</th>
                    </tr>
                </thead>
                <tbody id="lecturesTableBody">
                    ${allLectures.map(lecture => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px;">${lecture.lecture_number}</td>
                            <td style="padding: 12px 16px;">Month ${lecture.month}</td>
                            <td style="padding: 12px 16px;">${lecture.title}</td>
                            <td style="padding: 12px 16px;">${lecture.is_free ? 'FREE' : 'KES ' + (lecture.price || 0)}</td>
                            <td style="padding: 12px 16px;">${lecture.duration || 'N/A'}</td>
                            <td style="padding: 12px 16px;">
                                <button onclick="editLectureForm(${lecture.id})" style="padding: 6px 12px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">
                                    Edit
                                </button>
                                <button onclick="deleteLecture(${lecture.id})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
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
    
    const { error } = await window.supabase.from('lectures').insert([newLecture]);
    
    if (error) {
        showToast('Error: ' + error.message, true);
    } else {
        showToast('Lecture added successfully!');
        document.getElementById('lectureNumber').value = '';
        document.getElementById('lectureTitle').value = '';
        document.getElementById('lecturePrice').value = '';
        document.getElementById('lectureDuration').value = '';
        document.getElementById('lectureVideoUrl').value = '';
        document.getElementById('lectureNotes').value = '';
        document.getElementById('lectureIsFree').checked = false;
        renderLecturesManagement();
    }
};

window.deleteLecture = async function(lectureId) {
    if (confirm('Are you sure you want to delete this lecture?')) {
        const { error } = await window.supabase.from('lectures').delete().eq('id', lectureId);
        if (error) {
            showToast('Error deleting lecture', true);
        } else {
            showToast('Lecture deleted');
            renderLecturesManagement();
        }
    }
};

window.editLectureForm = async function(lectureId) {
    const lecture = allLectures.find(l => l.id === lectureId);
    if (!lecture) return;
    
    const newTitle = prompt('Edit lecture title:', lecture.title);
    if (newTitle && newTitle !== lecture.title) {
        const { error } = await window.supabase
            .from('lectures')
            .update({ title: newTitle })
            .eq('id', lectureId);
        
        if (error) {
            showToast('Error updating lecture', true);
        } else {
            showToast('Lecture updated');
            renderLecturesManagement();
        }
    }
};

window.deleteUser = async function(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const { error } = await window.supabase.from('profiles').delete().eq('id', userId);
        if (error) {
            showToast('Error deleting user', true);
        } else {
            showToast('User deleted');
            renderUsersManagement();
        }
    }
};

window.toggleAdminRole = async function(userId, makeAdmin) {
    const { error } = await window.supabase
        .from('profiles')
        .update({ is_admin: makeAdmin, role: makeAdmin ? 'admin' : 'user' })
        .eq('id', userId);
    
    if (error) {
        showToast('Error updating role', true);
    } else {
        showToast(makeAdmin ? 'User is now Admin' : 'Admin role removed');
        renderUsersManagement();
    }
};

// ========== FILTERS ==========
window.filterUsers = function() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';
    
    const filtered = allUsers.filter(user => {
        const matchesSearch = (user.email?.toLowerCase().includes(searchTerm) || 
                               user.full_name?.toLowerCase().includes(searchTerm));
        const matchesRole = roleFilter === 'all' || 
                           (roleFilter === 'admin' && user.is_admin) ||
                           (roleFilter === 'user' && !user.is_admin);
        return matchesSearch && matchesRole;
    });
    
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(user => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px;">${user.full_name || 'N/A'}</td>
                <td style="padding: 12px 16px;">${user.email || 'N/A'}</td>
                <td style="padding: 12px 16px;"><span style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; background: ${user.is_admin ? '#e8f5e9' : '#fff3e0'}; color: ${user.is_admin ? '#2e8b57' : '#f59e0b'};">${user.is_admin ? 'Admin' : 'User'}</span></td>
                <td style="padding: 12px 16px;">${new Date(user.created_at).toLocaleDateString()}</td>
                <td style="padding: 12px 16px;">
                    <button onclick="toggleAdminRole('${user.id}', ${!user.is_admin})" style="padding: 6px 12px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">
                        ${user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button onclick="deleteUser('${user.id}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Delete
                    </button>
                </td>
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
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px;">${lecture.lecture_number}</td>
                <td style="padding: 12px 16px;">Month ${lecture.month}</td>
                <td style="padding: 12px 16px;">${lecture.title}</td>
                <td style="padding: 12px 16px;">${lecture.is_free ? 'FREE' : 'KES ' + (lecture.price || 0)}</td>
                <td style="padding: 12px 16px;">${lecture.duration || 'N/A'}</td>
                <td style="padding: 12px 16px;">
                    <button onclick="editLectureForm(${lecture.id})" style="padding: 6px 12px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">Edit</button>
                    <button onclick="deleteLecture(${lecture.id})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete</button>
                </td>
            </tr>
        `).join('');
    }
};

// ========== EXPORT DATA ==========
window.exportAllData = async function() {
    await loadAllUsers();
    await loadAllLectures();
    await loadAllSales();
    
    const exportData = {
        exportDate: new Date().toISOString(),
        users: allUsers,
        lectures: allLectures,
        sales: allSales,
        summary: {
            totalUsers: allUsers.length,
            totalLectures: allLectures.length,
            totalSales: allSales.length,
            totalRevenue: allSales.reduce((sum, sale) => sum + (sale.amount_paid || 0), 0)
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nclex_admin_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Data exported successfully!');
};

// ========== NAVIGATION ==========
window.switchTab = async function(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) {
            item.classList.add('active');
        }
    });
    
    if (tab === 'dashboard') await renderDashboard();
    else if (tab === 'users') await renderUsersManagement();
    else if (tab === 'lectures' || tab === 'addLecture') await renderLecturesManagement();
};

window.logoutAdmin = async function() {
    await window.supabase.auth.signOut();
    location.reload();
};

// ========== INITIALIZE ADMIN PANEL ==========
async function initAdminPanel() {
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) return;
    
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div style="display: flex; min-height: 100vh;">
            <aside style="width: 280px; background: linear-gradient(180deg, #0f2b3d 0%, #1a4a63 100%); color: white;">
                <div style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 32px;">🔐</div>
                    <h2>Admin</h2>
                    <p style="font-size: 12px; opacity: 0.7;">NCLEX Manager</p>
                </div>
                <nav style="padding: 20px 0;">
                    <div class="admin-nav-item active" data-tab="dashboard" style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; cursor: pointer;">
                        <i class="fas fa-tachometer-alt"></i> <span>Dashboard</span>
                    </div>
                    <div class="admin-nav-item" data-tab="users" style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; cursor: pointer;">
                        <i class="fas fa-users"></i> <span>Users</span>
                    </div>
                    <div class="admin-nav-item" data-tab="lectures" style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; cursor: pointer;">
                        <i class="fas fa-book"></i> <span>Lectures</span>
                    </div>
                </nav>
                <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button onclick="logoutAdmin()" style="width: 100%; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </aside>
            
            <main style="flex: 1; padding: 24px; background: #f1f5f9;">
                <div style="background: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p style="color: #64748b;">Manage NCLEX Nursing Platform</p>
                    </div>
                    <div>
                        <span>${currentAdmin?.email}</span>
                    </div>
                </div>
                <div id="dynamicContent"></div>
            </main>
        </div>
    `;
    
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    appContent.style.display = 'block';
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    await renderDashboard();
}

// Start the admin panel
document.addEventListener('DOMContentLoaded', initAdminPanel);
