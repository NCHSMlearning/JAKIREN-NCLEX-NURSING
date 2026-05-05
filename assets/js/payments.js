// ============================================
// PAYMENTS MODULE
// ============================================

let pendingPurchase = null;

// Initialize payment for a lecture
async function initPayment(lecture) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        loadLoginPage();
        return false;
    }
    
    if (userPurchases.includes(lecture.id)) {
        showToast('Lecture already unlocked!');
        return false;
    }
    
    pendingPurchase = lecture;
    
    if (lecture.lecture_number === 2) {
        // Show bundle offer
        showBundleOffer();
    } else {
        // Show payment modal
        showPaymentModal(lecture);
    }
    
    return true;
}

// Show payment modal
function showPaymentModal(lecture) {
    const modal = document.getElementById('paymentModal');
    const content = document.getElementById('paymentModalContent');
    
    if (content) {
        content.innerHTML = `
            <div style="text-align: center;">
                <h3>${lecture.title}</h3>
                <div style="font-size: 36px; color: var(--success); font-weight: bold; margin: 20px 0;">
                    ${formatCurrency(lecture.price)}
                </div>
                <p style="margin-bottom: 20px;">Get lifetime access to this lecture</p>
                <button class="payment-btn btn-mpesa" onclick="processMpesaPayment()">
                    📱 M-Pesa (STK Push)
                </button>
                <button class="payment-btn btn-card" onclick="processCardPayment()">
                    💳 Card / PayPal
                </button>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

// Show bundle offer
function showBundleOffer() {
    const remaining = APP_CONFIG.TOTAL_LECTURES - userPurchases.length;
    const modal = document.getElementById('bundleModal');
    const content = document.getElementById('bundleModalContent');
    
    if (content) {
        content.innerHTML = `
            <div style="text-align: center;">
                <h2>🎉 Complete NCLEX Bundle!</h2>
                <p style="margin: 16px 0;">Unlock ALL remaining ${remaining} lectures</p>
                <div style="font-size: 48px; color: var(--success); font-weight: bold;">
                    ${formatCurrency(APP_CONFIG.BUNDLE_PRICE)}
                </div>
                <p style="margin: 16px 0;">Less than KES 1 per lecture!</p>
                <button class="btn btn-success" onclick="processBundlePurchase()" style="width: 100%; padding: 14px;">
                    🎯 Unlock Everything Now
                </button>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

// Process M-Pesa payment
async function processMpesaPayment() {
    if (!pendingPurchase) return;
    
    showToast('📱 M-Pesa STK Push sent to your phone');
    
    // Simulate payment - In production, integrate real M-Pesa API
    setTimeout(async () => {
        await completePurchase(pendingPurchase, 'mpesa');
        closePaymentModal();
        pendingPurchase = null;
    }, 2000);
}

// Process card payment
async function processCardPayment() {
    if (!pendingPurchase) return;
    
    showToast('💳 Redirecting to secure payment gateway...');
    
    setTimeout(async () => {
        await completePurchase(pendingPurchase, 'card');
        closePaymentModal();
        pendingPurchase = null;
    }, 1500);
}

// Process bundle purchase
async function processBundlePurchase() {
    if (!currentUser) return;
    
    showToast('Processing bundle purchase...');
    
    const lockedLectures = allLectures.filter(l => 
        l.lecture_number > 2 && !userPurchases.includes(l.id)
    );
    
    // Record bundle purchase
    await supabase.from('bundle_purchases').insert([
        { user_id: currentUser.id, amount_paid: APP_CONFIG.BUNDLE_PRICE }
    ]);
    
    // Unlock all lectures
    for (const lecture of lockedLectures) {
        await supabase.from('user_purchases').upsert([
            { user_id: currentUser.id, lecture_id: lecture.id, amount_paid: 0 }
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
        .update({ total_spent: (profile?.total_spent || 0) + APP_CONFIG.BUNDLE_PRICE })
        .eq('id', currentUser.id);
    
    showToast('🎉 Bundle unlocked! You have access to ALL lectures!');
    closeBundleModal();
    
    // Reload purchases and refresh UI
    await loadUserPurchases();
    await renderLectures();
    updateDashboardStats();
}

// Complete single purchase
async function completePurchase(lecture, method) {
    // Insert purchase record
    await supabase.from('user_purchases').insert([
        { user_id: currentUser.id, lecture_id: lecture.id, amount_paid: lecture.price }
    ]);
    
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
    
    // Reload purchases and refresh UI
    await loadUserPurchases();
    await renderLectures();
    updateDashboardStats();
    
    // Offer bundle after lecture 2
    if (lecture.lecture_number === 2) {
        setTimeout(() => {
            const remaining = APP_CONFIG.TOTAL_LECTURES - userPurchases.length;
            if (remaining > 0 && confirm(`🎉 Special offer! Unlock remaining ${remaining} lectures for ${formatCurrency(APP_CONFIG.BUNDLE_PRICE)}?`)) {
                showBundleOffer();
            }
        }, 1000);
    }
}

// Close modals
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

function closeBundleModal() {
    const modal = document.getElementById('bundleModal');
    if (modal) modal.style.display = 'none';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.style.display = 'none';
        const videoContainer = document.getElementById('videoContainer');
        if (videoContainer) videoContainer.innerHTML = '';
    }
}
