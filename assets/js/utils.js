// ============================================
// UTILITY FUNCTIONS
// ============================================

// NO 'const supabase' here!

function formatCurrency(amount) {
    return `KES ${amount.toLocaleString()}`;
}

function getMonthName(monthNumber) {
    const months = {
        1: 'Fundamentals',
        2: 'Medical-Surgical',
        3: 'Pharmacology',
        4: 'Maternity & Pediatrics',
        5: 'Psychiatric Nursing',
        6: 'Final Review'
    };
    return months[monthNumber] || `Month ${monthNumber}`;
}

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

function showLoading(show) {
    const loader = document.getElementById('loadingScreen');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showAppContent(show) {
    const content = document.getElementById('appContent');
    if (content) content.style.display = show ? 'block' : 'none';
}
