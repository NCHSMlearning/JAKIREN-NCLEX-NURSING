// ============================================
// AUTHENTICATION MODULE
// ============================================

let currentUser = null;

// Login user
async function login(email, password) {
    try {
        showLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(currentUser));
        showToast('Login successful! Redirecting...');
        
        setTimeout(() => {
            loadDashboard();
        }, 1000);
        
        return { success: true, user: currentUser };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
    } finally {
        showLoading(false);
    }
}

// Register user
async function register(name, email, password) {
    try {
        showLoading(true);
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: name }
            }
        });
        
        if (authError) throw authError;
        
        // Create profile
        await supabase.from('profiles').insert([
            { id: authData.user.id, full_name: name, total_spent: 0 }
        ]);
        
        // Assign free lecture (lecture 1)
        const { data: freeLecture } = await supabase
            .from('lectures')
            .select('id')
            .eq('lecture_number', 1)
            .single();
        
        if (freeLecture) {
            await supabase.from('user_purchases').insert([
                { user_id: authData.user.id, lecture_id: freeLecture.id, amount_paid: 0 }
            ]);
        }
        
        showToast('Registration successful! Please login.');
        return { success: true };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
    } finally {
        showLoading(false);
    }
}

// Logout user
async function logout() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
        showToast('Logged out successfully');
        loadLoginPage();
    } catch (error) {
        showToast('Error logging out', 'error');
    }
}

// Check if user is logged in
async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = user;
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}
