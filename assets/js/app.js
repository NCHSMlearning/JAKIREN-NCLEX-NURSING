// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================

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

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Register service worker for PWA (for Android app)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registered:', registration.scope);
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}
