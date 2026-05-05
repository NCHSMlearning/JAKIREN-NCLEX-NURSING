// JAKIREN NCLEX NURSING - Supabase Integration
// ==============================================

// SUPABASE CONFIGURATION - REPLACE WITH YOUR CREDENTIALS!
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';  // ← PASTE YOUR URL
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';  // ← PASTE YOUR ANON KEY

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let allLectures = [];
let userPurchases = [];
let currentFilter = 'all';
let currentMonth = 'all';
let pendingLecture = null;

// ========== AUTHENTICATION ==========
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        showToast(error.message, true);
        return;
    }
    
    currentUser = data.user;
    showToast(`Welcome back to Jakiren NCLEX!`);
    closeModal('loginModal');
    await loadUserData();
    updateUI();
}

async function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!name || !email || !password) {
        showToast('Please fill all fields', true);
        return;
    }
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: name }
        }
    });
    
    if (authError) {
        showToast(authError.message, true);
        return;
    }
    
    // Create profile
    await supabase.from('profiles').insert([
        { id: authData.user.id, full_name: name, total_spent: 0 }
    ]);
    
    // Auto-assign free lecture (lecture 1)
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
    closeModal('registerModal');
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    userPurchases = [];
    showToast('Logged out successfully');
    updateUI();
}

// ========== LOAD DATA ==========
async function loadLectures() {
    const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('lecture_number', { ascending: true });
    
    if (error) {
        console.error('Error loading lectures:', error);
        return [];
    }
    
    allLectures = data;
    return data;
}

async function loadUserPurchases() {
    if (!currentUser) return [];
    
    const { data, error } = await supabase
        .from('user_purchases')
        .select('lecture_id')
        .eq('user_id', currentUser.id);
    
    if (error) {
        console.error('Error loading purchases:', error);
        return [];
    }
    
    userPurchases = data.map(p => p.lecture_id);
    return userPurchases;
}

async function loadUserData() {
    await loadUserPurchases();
    await renderLectures();
    updateStats();
}

// ========== PAYMENT PROCESSING ==========
async function unlockLecture(lecture) {
    if (!currentUser) {
        showToast('Please login first', true);
        showLoginModal();
        return;
    }
    
    if (userPurchases.includes(lecture.id)) {
        showToast('Lecture already unlocked!');
        return;
    }
    
    pendingLecture = lecture;
    
    if (lecture.lecture_number === 2) {
        // Show bundle offer
        const remaining = allLectures.filter(l => 
            l.lecture_number > 2 && !userPurchases.includes(l.id)
        ).length;
        document.getElementById('remainingCount').textContent = remaining;
        showModal('bundleModal');
    } else {
        // Show regular payment
        const paymentDetails = document.getElementById('paymentDetails');
        paymentDetails.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3>${lecture.title}</h3>
                <div style="font-size: 36px; color: #48bb78; font-weight: bold; margin: 20px 0;">KES ${lecture.price}</div>
                <p>✓ Lifetime access to this lecture</p>
                <p>✓ Downloadable study notes</p>
                <p>✓ Watch anytime, anywhere</p>
            </div>
        `;
        showModal('paymentModal');
    }
}

async function processMpesa() {
    if (!pendingLecture || !currentUser) return;
    
    showToast('📱 M-Pesa STK Push sent to your phone. Enter PIN to complete.');
    
    // Simulate payment - In production, integrate M-Pesa API
    setTimeout(async () => {
        await completePurchase(pendingLecture, 'mpesa');
        closeModal('paymentModal');
        pendingLecture = null;
    }, 2000);
}

async function processCard() {
    if (!pendingLecture || !currentUser) return;
    
    showToast('💳 Redirecting to secure payment gateway...');
    
    setTimeout(async () => {
        await completePurchase(pendingLecture, 'card');
        closeModal('paymentModal');
        pendingLecture = null;
    }, 1500);
}

async function purchaseBundle() {
    if (!currentUser || !pendingLecture) return;
    
    showToast('🎉 Processing bundle purchase...');
    
    // Get all locked lectures (except lecture 1 and 2)
    const lockedLectures = allLectures.filter(l => 
        l.lecture_number > 2 && !userPurchases.includes(l.id)
    );
    
    // Record bundle purchase
    await supabase.from('bundle_purchases').insert([
        { user_id: currentUser.id, amount_paid: 60 }
    ]);
    
    // Unlock all lectures
    for (const lecture of lockedLectures) {
        await supabase.from('user_purchases').insert([
            { user_id: currentUser.id, lecture_id: lecture.id, amount_paid: 0 } // Bundle price handled separately
        ]);
    }
    
    // Update profile total spent
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_spent')
        .eq('id', currentUser.id)
        .single();
    
    await supabase
        .from('profiles')
        .update({ total_spent: (profile?.total_spent || 0) + 60 })
        .eq('id', currentUser.id);
    
    showToast(`🎉 Bundle unlocked! You now have access to ALL lectures!`);
    closeModal('bundleModal');
    closeModal('paymentModal');
    pendingLecture = null;
    await loadUserData();
}

async function completePurchase(lecture, method) {
    // Insert purchase record
    const { error: purchaseError } = await supabase
        .from('user_purchases')
        .insert([
            { user_id: currentUser.id, lecture_id: lecture.id, amount_paid: lecture.price }
        ]);
    
    if (purchaseError) {
        showToast('Payment failed. Please try again.', true);
        return;
    }
    
    // Record transaction
    await supabase.from('transactions').insert([
        { 
            user_id: currentUser.id, 
            amount: lecture.price, 
            payment_method: method,
            transaction_id: `TXN_${Date.now()}`,
            status: 'completed'
        }
    ]);
    
    // Update profile total spent
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_spent')
        .eq('id', currentUser.id)
        .single();
    
    await supabase
        .from('profiles')
        .update({ total_spent: (profile?.total_spent || 0) + lecture.price })
        .eq('id', currentUser.id);
    
    showToast(`✅ Successfully unlocked: ${lecture.title}`);
    await loadUserData();
    
    // Show bundle offer after lecture 2 purchase
    if (lecture.lecture_number === 2) {
        setTimeout(() => {
            const remaining = allLectures.filter(l => 
                l.lecture_number > 2 && !userPurchases.includes(l.id)
            ).length;
            if (remaining > 0) {
                if (confirm(`🎉 Special offer! Unlock all remaining ${remaining} lectures for only KES 60?`)) {
                    unlockLecture(lecture);
                }
            }
        }, 1000);
    }
}

// ========== UI RENDERING ==========
async function renderLectures() {
    const grid = document.getElementById('lecturesGrid');
    
    if (allLectures.length === 0) {
        await loadLectures();
    }
    
    let filteredLectures = [...allLectures];
    
    if (currentMonth !== 'all') {
        filteredLectures = filteredLectures.filter(l => l.month === parseInt(currentMonth));
    }
    
    if (currentFilter === 'free') {
        filteredLectures = filteredLectures.filter(l => l.is_free);
    } else if (currentFilter === 'unlocked') {
        filteredLectures = filteredLectures.filter(l => userPurchases.includes(l.id));
    } else if (currentFilter === 'locked') {
        filteredLectures = filteredLectures.filter(l => !userPurchases.includes(l.id) && !l.is_free);
    }
    
    if (filteredLectures.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: white; padding: 50px;">No lectures found</div>';
        return;
    }
    
    grid.innerHTML = filteredLectures.map(lecture => {
        const isPurchased = userPurchases.includes(lecture.id);
        const canAccess = isPurchased || lecture.is_free;
        
        let badge = '';
        if (lecture.is_free) {
            badge = '<div class="free-badge">🎁 FREE LECTURE</div>';
        } else if (isPurchased) {
            badge = '<div class="unlocked-badge">✅ UNLOCKED</div>';
        } else {
            badge = '<div class="locked-badge">🔒 LOCKED</div>';
        }
        
        let priceHtml = '';
        if (!lecture.is_free && !isPurchased) {
            if (lecture.lecture_number === 2) {
                priceHtml = `<div class="lecture-price">🔥 SPECIAL: KES ${lecture.price} <small>(then KES 60 for all)</small></div>`;
            } else {
                priceHtml = `<div class="lecture-price">KES ${lecture.price} <small>one-time</small></div>`;
            }
        }
        
        return `
            <div class="lecture-card ${!canAccess ? 'locked' : ''}">
                ${badge}
                <div class="lecture-number">Lecture ${lecture.lecture_number} • Month ${lecture.month}</div>
                <div class="lecture-title">${lecture.title}</div>
                <div class="lecture-duration">⏱️ ${lecture.duration}</div>
                ${priceHtml}
                ${canAccess ? `
                    <button class="watch-btn" onclick="watchLecture(${lecture.id})">
                        🎥 Watch Lecture
                    </button>
                ` : `
                    <button class="unlock-btn" onclick="unlockLecture(${JSON.stringify(lecture).replace(/"/g, '&quot;')})">
                        🔓 Unlock for KES ${lecture.price}
                    </button>
                `}
            </div>
        `;
    }).join('');
}

async function watchLecture(lectureId) {
    const lecture = allLectures.find(l => l.id === lectureId);
    if (!lecture) return;
    
    const hasAccess = userPurchases.includes(lecture.id) || lecture.is_free;
    
    if (!hasAccess) {
        showToast('🔒 Please purchase this lecture first', true);
        return;
    }
    
    document.getElementById('videoHeader').innerHTML = `
        <h2>${lecture.title}</h2>
        <p style="color: #718096; margin-top: 5px;">${lecture.duration} • Month ${lecture.month}</p>
    `;
    
    document.getElementById('videoContainer').innerHTML = `
        <iframe 
            src="${lecture.video_url}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    
    document.getElementById('videoNotes').innerHTML = `
        <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 10px;">
            <strong>📚 Study Notes:</strong><br>
            ${lecture.study_notes || 'Complete study guide and practice questions included.'}
        </div>
    `;
    
    showModal('videoModal');
}

function updateStats() {
    if (!currentUser) {
        document.getElementById('purchasedCount').textContent = '0';
        document.getElementById('totalSpent').textContent = '0';
        document.getElementById('remainingLectures').textContent = '180';
        document.getElementById('progressPercent').textContent = '0%';
        return;
    }
    
    const purchasedCount = userPurchases.length;
    const remaining = 180 - purchasedCount;
    const percent = Math.round((purchasedCount / 180) * 100);
    
    document.getElementById('purchasedCount').textContent = purchasedCount;
    document.getElementById('remainingLectures').textContent = remaining;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    
    // Load total spent from profile
    supabase.from('profiles')
        .select('total_spent')
        .eq('id', currentUser.id)
        .single()
        .then(({ data }) => {
            document.getElementById('totalSpent').textContent = data?.total_spent || 0;
        });
}

async function updateUI() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        currentUser = user;
        await loadUserPurchases();
        
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('userName').innerHTML = `👋 ${user.user_metadata?.full_name || user.email}`;
    } else {
        currentUser = null;
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('userProfile').style.display = 'none';
    }
    
    await renderLectures();
    updateStats();
}

// ========== HELPER FUNCTIONS ==========
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc3545' : '#2e8b57';
    toast.className = 'toast show';
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showLoginModal() { showModal('loginModal'); }
function showRegisterModal() { showModal('registerModal'); }

function filterLectures(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event?.target) event.target.classList.add('active');
    renderLectures();
}

function filterByMonth() {
    currentMonth = document.getElementById('monthFilter').value;
    renderLectures();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadLectures();
    await updateUI();
    
    // Check auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            await loadUserData();
            updateUI();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            userPurchases = [];
            updateUI();
        }
    });
    
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});
