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
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a2f3f, #031f2f);">
            <div style="background: white; border-radius: 24px; padding: 40px; width: 400px; max-width: 90%;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 48px;">🔐</div>
                    <h2>Admin Login</h2>
                </div>
                <input type="email" id="adminEmail" placeholder="Email" style="width: 100%; padding: 12px; margin-bottom: 16px; border-radius: 10px; border: 1px solid #ddd;">
                <input type="password" id="adminPassword" placeholder="Password" style="width: 100%; padding: 12px; margin-bottom: 24px; border-radius: 10px; border: 1px solid #ddd;">
                <button onclick="adminLogin()" style="width: 100%; padding: 12px; background: #1b4f6e; color: white; border: none; border-radius: 10px; cursor: pointer;">Login</button>
            </div>
        </div>
    `;
    appContent.style.display = 'block';
    document.getElementById('loadingScreen').style.display = 'none';
}

function showAccessDenied() {
    const appContent = document.getElementById('appContent');
    if (!appContent) return;
    
    appContent.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
            <div style="background: white; border-radius: 24px; padding: 40px;">
                <i class="fas fa-lock" style="font-size: 64px; color: #dc3545;"></i>
                <h2>Access Denied</h2>
                <p>You don't have permission to access the admin panel.</p>
                <button onclick="window.location.href='index.html'" style="margin-top: 20px; padding: 12px 24px; background: #1b4f6e; color: white; border: none; border-radius: 10px; cursor: pointer;">Back to Home</button>
            </div>
        </div>
    `;
    appContent.style.display = 'block';
    document.getElementById('loadingScreen').style.display = 'none';
}

window.adminLogin = async function() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    const { error } = await window.supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showToast('Login failed: ' + error.message, true);
    } else {
        showToast('Login successful!');
        setTimeout(() => location.reload(), 1000);
    }
};

// ========== LOAD DATA ==========
async function loadAllUsers() {
    // Get users from auth and join with profiles
    const { data: users, error } = await window.supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('Error loading users:', error);
        // Fallback: get from profiles
        const { data: profiles } = await window.supabase.from('profiles').select('*');
        allUsers = profiles || [];
        return allUsers;
    }
    
    // Get profiles data
    const { data: profiles } = await window.supabase.from('profiles').select('*');
    const profileMap = new Map();
    profiles?.forEach(p => profileMap.set(p.id, p));
    
    allUsers = users.users.map(user => ({
        id: user.id,
        email: user.email,
        full_name: profileMap.get(user.id)?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        is_admin: profileMap.get(user.id)?.is_admin || false,
        role: profileMap.get(user.id)?.role || 'user',
        is_locked: profileMap.get(user.id)?.is_locked || false,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
    }));
    
    return allUsers;
}

async function loadAllLectures() {
    const { data, error } = await window.supabase
        .from('lectures')
        .select('*')
        .order('lecture_number');
    
    if (error) console.error('Error loading lectures:', error);
    allLectures = data || [];
    return allLectures;
}

async function loadAllSales() {
    const { data, error } = await window.supabase
        .from('user_purchases')
        .select('*, profiles!user_purchases_user_id_fkey(id, full_name)')
        .order('purchased_at', { ascending: false });
    
    if (error) console.error('Error loading sales:', error);
    allSales = data || [];
    return allSales;
}

// ========== USER MANAGEMENT FUNCTIONS ==========

// Edit user details
window.editUser = async function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const newName = prompt('Edit full name:', user.full_name);
    if (newName && newName !== user.full_name) {
        const { error } = await window.supabase
            .from('profiles')
            .update({ full_name: newName })
            .eq('id', userId);
        
        if (error) {
            showToast('Error updating name: ' + error.message, true);
        } else {
            showToast('User name updated!');
            await loadAllUsers();
            renderUsersManagement();
        }
    }
};

// Reset user password
window.resetUserPassword = async function(userId, email) {
    if (confirm(`Reset password for ${email}? They will receive a password reset email.`)) {
        const { error } = await window.supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email
        });
        
        if (error) {
            showToast('Error: ' + error.message, true);
        } else {
            showToast(`Password reset email sent to ${email}`);
        }
    }
};

// Toggle user access (lock/unlock account)
window.toggleUserAccess = async function(userId, currentLocked) {
    const action = currentLocked ? 'unlock' : 'lock';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
        const { error } = await window.supabase
            .from('profiles')
            .update({ is_locked: !currentLocked })
            .eq('id', userId);
        
        if (error) {
            showToast('Error: ' + error.message, true);
        } else {
            showToast(`User ${action}ed successfully!`);
            await loadAllUsers();
            renderUsersManagement();
        }
    }
};

// Toggle admin role
window.toggleAdminRole = async function(userId, makeAdmin) {
    const { error } = await window.supabase
        .from('profiles')
        .update({ is_admin: makeAdmin, role: makeAdmin ? 'admin' : 'user' })
        .eq('id', userId);
    
    if (error) {
        showToast('Error updating role: ' + error.message, true);
    } else {
        showToast(makeAdmin ? 'User is now Admin' : 'Admin role removed');
        await loadAllUsers();
        renderUsersManagement();
    }
};

// Delete user
window.deleteUser = async function(userId, email) {
    if (confirm(`⚠️ WARNING: Delete user ${email}?\nThis action cannot be undone!`)) {
        const { error } = await window.supabase.auth.admin.deleteUser(userId);
        
        if (error) {
            showToast('Error deleting user: ' + error.message, true);
        } else {
            showToast('User deleted successfully');
            await loadAllUsers();
            renderUsersManagement();
        }
    }
};

// View user purchases
window.viewUserPurchases = async function(userId, userName) {
    const { data: purchases } = await window.supabase
        .from('user_purchases')
        .select('*, lectures(*)')
        .eq('user_id', userId);
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <h3>${userName}'s Purchases</h3>
                <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            ${purchases?.length > 0 ? `
                <ul style="list-style: none; padding: 0;">
                    ${purchases.map(p => `
                        <li style="padding: 12px; border-bottom: 1px solid #eee;">
                            <strong>Lecture ${p.lectures?.lecture_number}:</strong> ${p.lectures?.title}<br>
                            <small>Paid: KES ${p.amount_paid} on ${new Date(p.purchased_at).toLocaleDateString()}</small>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>No purchases yet.</p>'}
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Grant free access to lecture
window.grantFreeAccess = async function(userId, lectureId) {
    const lecture = allLectures.find(l => l.id == lectureId);
    if (!lecture) return;
    
    if (confirm(`Grant free access to "${lecture.title}" for this user?`)) {
        const { error } = await window.supabase
            .from('user_purchases')
            .insert([{ user_id: userId, lecture_id: lectureId, amount_paid: 0 }]);
        
        if (error) {
            showToast('Error: ' + error.message, true);
        } else {
            showToast(`Free access granted for ${lecture.title}`);
        }
    }
};

// ========== RENDER DASHBOARD ==========
async function renderDashboard() {
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    await loadAllUsers();
    await loadAllLectures();
    await loadAllSales();
    
    const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.amount_paid || 0), 0);
    const uniqueStudents = new Set(allSales.map(s => s.user_id)).size;
    
    contentDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px;">
            <div style="background: white; border-radius: 20px; padding: 20px;">
                <h3 style="font-size: 32px;">${allUsers.length}</h3>
                <p>Total Users</p>
            </div>
            <div style="background: white; border-radius: 20px; padding: 20px;">
                <h3 style="font-size: 32px;">${allLectures.length}</h3>
                <p>Total Lectures</p>
            </div>
            <div style="background: white; border-radius: 20px; padding: 20px;">
                <h3 style="font-size: 32px;">${uniqueStudents}</h3>
                <p>Active Students</p>
            </div>
            <div style="background: white; border-radius: 20px; padding: 20px;">
                <h3 style="font-size: 32px;">KES ${totalRevenue.toLocaleString()}</h3>
                <p>Total Revenue</p>
            </div>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
            <h3>Quick Actions</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="btn btn-primary" onclick="switchTab('users')" style="padding: 10px 20px; background: #1b4f6e; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-users"></i> Manage Users
                </button>
                <button class="btn btn-success" onclick="switchTab('lectures')" style="padding: 10px 20px; background: #2e8b57; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-book"></i> Manage Lectures
                </button>
                <button class="btn btn-info" onclick="exportAllData()" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-download"></i> Export Data
                </button>
            </div>
        </div>
        
        <div style="background: white; border-radius: 20px; overflow-x: auto;">
            <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <h3>Recent Sales</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f1f5f9;">
                    <tr><th style="padding: 12px 16px;">User</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                    ${allSales.slice(0, 10).map(sale => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px;">${sale.profiles?.full_name || sale.user_id?.slice(0, 8)}</td>
                            <td style="padding: 12px 16px;">KES ${(sale.amount_paid || 0).toLocaleString()}</td>
                            <td style="padding: 12px 16px;">${new Date(sale.purchased_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
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
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px;">
                <input type="text" id="userSearch" placeholder="🔍 Search users..." onkeyup="filterUsers()" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <select id="roleFilter" onchange="filterUsers()" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                </select>
                <select id="statusFilter" onchange="filterUsers()" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="locked">Locked</option>
                </select>
            </div>
        </div>
        
        <div style="background: white; border-radius: 20px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f1f5f9;">
                    <tr>
                        <th style="padding: 12px 16px;">Name</th>
                        <th style="padding: 12px 16px;">Email</th>
                        <th style="padding: 12px 16px;">Role</th>
                        <th style="padding: 12px 16px;">Status</th>
                        <th style="padding: 12px 16px;">Joined</th>
                        <th style="padding: 12px 16px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    ${allUsers.map(user => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 16px;">${user.full_name || 'N/A'}</td>
                            <td style="padding: 12px 16px;">${user.email || 'N/A'}</td>
                            <td style="padding: 12px 16px;">
                                <span style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; background: ${user.is_admin ? '#e8f5e9' : '#fff3e0'}; color: ${user.is_admin ? '#2e8b57' : '#f59e0b'};">
                                    ${user.is_admin ? 'Admin' : 'User'}
                                </span>
                            </td>
                            <td style="padding: 12px 16px;">
                                <span style="display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; background: ${user.is_locked ? '#ffebee' : '#e8f5e9'}; color: ${user.is_locked ? '#dc3545' : '#2e8b57'};">
                                    ${user.is_locked ? '🔒 Locked' : '✅ Active'}
                                </span>
                            </td>
                            <td style="padding: 12px 16px;">${new Date(user.created_at).toLocaleDateString()}</td>
                            <td style="padding: 12px 16px;">
                                <button onclick="editUser('${user.id}')" title="Edit User" style="padding: 6px 10px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="viewUserPurchases('${user.id}', '${user.full_name}')" title="View Purchases" style="padding: 6px 10px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                                <button onclick="resetUserPassword('${user.id}', '${user.email}')" title="Reset Password" style="padding: 6px 10px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas fa-key"></i>
                                </button>
                                <button onclick="toggleUserAccess('${user.id}', ${user.is_locked})" title="${user.is_locked ? 'Unlock' : 'Lock'} User" style="padding: 6px 10px; background: ${user.is_locked ? '#2e8b57' : '#dc3545'}; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas ${user.is_locked ? 'fa-unlock-alt' : 'fa-lock'}"></i>
                                </button>
                                <button onclick="toggleAdminRole('${user.id}', ${!user.is_admin})" title="${user.is_admin ? 'Remove Admin' : 'Make Admin'}" style="padding: 6px 10px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas ${user.is_admin ? 'fa-user-minus' : 'fa-user-plus'}"></i>
                                </button>
                                <button onclick="deleteUser('${user.id}', '${user.email}')" title="Delete User" style="padding: 6px 10px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
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
                <input type="text" id="lectureDuration" placeholder="Duration" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <input type="text" id="lectureVideoUrl" placeholder="YouTube URL" style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
            </div>
            <textarea id="lectureNotes" rows="3" placeholder="Study Notes" style="width: 100%; margin-top: 16px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;"></textarea>
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
        
        <div style="background: white; border-radius: 20px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f1f5f9;">
                    <tr><th>#</th><th>Month</th><th>Title</th><th>Price</th><th>Duration</th><th>Actions</th></tr>
                </thead>
                <tbody id="lecturesTableBody">
                    ${allLectures.map(lecture => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">${lecture.lecture_number}</td>
                            <td style="padding: 12px;">Month ${lecture.month}</td>
                            <td style="padding: 12px;">${lecture.title}</td>
                            <td style="padding: 12px;">${lecture.is_free ? 'FREE' : 'KES ' + (lecture.price || 0)}</td>
                            <td style="padding: 12px;">${lecture.duration || 'N/A'}</td>
                            <td style="padding: 12px;">
                                <button onclick="editLecture(${lecture.id})" style="padding: 6px 12px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer;">Edit</button>
                                <button onclick="deleteLecture(${lecture.id})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete</button>
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
        renderLecturesManagement();
    }
};

window.editLecture = async function(lectureId) {
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

window.deleteLecture = async function(lectureId) {
    if (confirm('Delete this lecture?')) {
        const { error } = await window.supabase.from('lectures').delete().eq('id', lectureId);
        if (error) {
            showToast('Error deleting lecture', true);
        } else {
            showToast('Lecture deleted');
            renderLecturesManagement();
        }
    }
};

// ========== FILTERS ==========
window.filterUsers = function() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    const filtered = allUsers.filter(user => {
        const matchesSearch = (user.email?.toLowerCase().includes(searchTerm) || 
                               user.full_name?.toLowerCase().includes(searchTerm));
        const matchesRole = roleFilter === 'all' || 
                           (roleFilter === 'admin' && user.is_admin) ||
                           (roleFilter === 'user' && !user.is_admin);
        const matchesStatus = statusFilter === 'all' ||
                             (statusFilter === 'locked' && user.is_locked) ||
                             (statusFilter === 'active' && !user.is_locked);
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(user => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px;">${user.full_name || 'N/A'}</td>
                <td style="padding: 12px 16px;">${user.email || 'N/A'}</td>
                <td style="padding: 12px 16px;"><span style="padding: 4px 12px; border-radius: 50px; background: ${user.is_admin ? '#e8f5e9' : '#fff3e0'};">${user.is_admin ? 'Admin' : 'User'}</span></td>
                <td style="padding: 12px 16px;"><span style="padding: 4px 12px; border-radius: 50px; background: ${user.is_locked ? '#ffebee' : '#e8f5e9'};">${user.is_locked ? 'Locked' : 'Active'}</span></td>
                <td style="padding: 12px 16px;">${new Date(user.created_at).toLocaleDateString()}</td>
                <td style="padding: 12px 16px;">
                    <button onclick="editUser('${user.id}')" style="padding: 6px 10px; background: #1b4f6e; color: white; border: none; border-radius: 6px; cursor: pointer;">Edit</button>
                    <button onclick="toggleUserAccess('${user.id}', ${user.is_locked})" style="padding: 6px 10px; background: ${user.is_locked ? '#2e8b57' : '#dc3545'}; color: white; border: none; border-radius: 6px; cursor: pointer;">${user.is_locked ? 'Unlock' : 'Lock'}</button>
                    <button onclick="toggleAdminRole('${user.id}', ${!user.is_admin})" style="padding: 6px 10px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">${user.is_admin ? 'Remove Admin' : 'Make Admin'}</button>
                </td>
            </tr>
        `).join('');
    }
};

window.filterLectures = function() {
    const searchTerm = document.getElementById('lectureSearch')?.value.toLowerCase() || '';
    const filtered = allLectures.filter(l => l.title.toLowerCase().includes(searchTerm));
    
    const tbody = document.getElementById('lecturesTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(lecture => `
            <tr><td>${lecture.lecture_number}</td><td>Month ${lecture.month}</td><td>${lecture.title}</td><td>${lecture.is_free ? 'FREE' : 'KES ' + (lecture.price || 0)}</td><td>${lecture.duration || 'N/A'}</td>
            <td><button onclick="editLecture(${lecture.id})">Edit</button> <button onclick="deleteLecture(${lecture.id})">Delete</button></td></tr>
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
    showToast('Data exported!');
};

// ========== NAVIGATION ==========
window.switchTab = async function(tab) {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) item.classList.add('active');
    });
    
    if (tab === 'dashboard') await renderDashboard();
    else if (tab === 'users') await renderUsersManagement();
    else if (tab === 'lectures') await renderLecturesManagement();
};

window.logoutAdmin = async function() {
    await window.supabase.auth.signOut();
    location.reload();
};

// ========== INITIALIZE ==========
async function initAdminPanel() {
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) return;
    
    const appContent = document.getElementById('appContent');
    appContent.innerHTML = `
        <div style="display: flex; min-height: 100vh;">
            <aside style="width: 280px; background: linear-gradient(180deg, #0f2b3d 0%, #1a4a63 100%); color: white;">
                <div style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 32px;">🔐</div>
                    <h2>Admin Panel</h2>
                </div>
                <nav style="padding: 20px 0;">
                    <div class="admin-nav-item active" data-tab="dashboard" style="padding: 12px 24px; cursor: pointer;"><i class="fas fa-tachometer-alt"></i> Dashboard</div>
                    <div class="admin-nav-item" data-tab="users" style="padding: 12px 24px; cursor: pointer;"><i class="fas fa-users"></i> Users</div>
                    <div class="admin-nav-item" data-tab="lectures" style="padding: 12px 24px; cursor: pointer;"><i class="fas fa-book"></i> Lectures</div>
                </nav>
                <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button onclick="logoutAdmin()" style="width: 100%; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">Logout</button>
                </div>
            </aside>
            <main style="flex: 1; padding: 24px; background: #f1f5f9;">
                <div style="background: white; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <h1>Admin Dashboard</h1>
                    <p style="color: #64748b;">Manage NCLEX Nursing Platform</p>
                </div>
                <div id="dynamicContent"></div>
            </main>
        </div>
    `;
    
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.getAttribute('data-tab')));
    });
    
    appContent.style.display = 'block';
    document.getElementById('loadingScreen').style.display = 'none';
    await renderDashboard();
}

// Add is_locked column to profiles (run once)
async function addLockedColumn() {
    const { error } = await window.supabase.rpc('add_locked_column');
    if (error) console.log('Column may already exist');
}

// Start
document.addEventListener('DOMContentLoaded', initAdminPanel);
