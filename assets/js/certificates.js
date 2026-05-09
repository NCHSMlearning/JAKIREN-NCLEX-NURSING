// ============================================
// CERTIFICATES MODULE
// ============================================

// Render certificates view
async function renderCertificatesView() {
    console.log('🏆 Rendering certificates view...');
    
    const contentDiv = document.getElementById('dynamicContent');
    if (!contentDiv) return;
    
    // Ensure data is loaded
    if (window.allLectures && window.allLectures.length === 0) {
        await window.loadLectures();
    }
    if (window.userPurchases && window.userPurchases.length === 0) {
        await window.loadUserPurchases();
    }
    
    const totalLectures = window.allLectures?.length || 180;
    const unlockedCount = window.userPurchases?.length || 0;
    const percentComplete = Math.round((unlockedCount / totalLectures) * 100);
    
    // Define achievements
    const achievements = [
        { name: "First Steps", icon: "fa-shoe-prints", requirement: 1, progress: unlockedCount, earned: unlockedCount >= 1, description: "Unlock your first lecture" },
        { name: "Getting Started", icon: "fa-rocket", requirement: 10, progress: unlockedCount, earned: unlockedCount >= 10, description: "Complete 10 lectures" },
        { name: "Dedicated Learner", icon: "fa-book", requirement: 30, progress: unlockedCount, earned: unlockedCount >= 30, description: "Complete 30 lectures" },
        { name: "Almost There", icon: "fa-chart-line", requirement: 60, progress: unlockedCount, earned: unlockedCount >= 60, description: "Complete 60 lectures" },
        { name: "Halfway Hero", icon: "fa-medal", requirement: 90, progress: unlockedCount, earned: unlockedCount >= 90, description: "Complete 90 lectures" },
        { name: "Nearly Nurse", icon: "fa-stethoscope", requirement: 150, progress: unlockedCount, earned: unlockedCount >= 150, description: "Complete 150 lectures" },
        { name: "NCLEX Champion", icon: "fa-crown", requirement: 180, progress: unlockedCount, earned: unlockedCount >= 180, description: "Complete all 180 lectures" }
    ];
    
    // Calculate next achievement
    const nextAchievement = achievements.find(a => !a.earned);
    const progressToNext = nextAchievement ? Math.min(100, Math.round((unlockedCount / nextAchievement.requirement) * 100)) : 100;
    
    contentDiv.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px; text-align: center;">
            <i class="fas fa-certificate" style="font-size: 64px; color: var(--primary); margin-bottom: 16px;"></i>
            <h2>Your Achievement Certificates</h2>
            <p style="color: var(--gray);">Complete milestones to earn certificates and badges</p>
        </div>
        
        ${percentComplete === 100 ? `
            <div style="background: linear-gradient(135deg, var(--success), var(--success-light)); border-radius: 24px; padding: 32px; margin-bottom: 24px; text-align: center; color: white;">
                <i class="fas fa-trophy" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h2 style="color: white;">🎉 NCLEX Master Certificate 🎉</h2>
                <p>Congratulations! You've completed all 180 lectures!</p>
                <button class="btn btn-primary" style="margin-top: 16px; background: white; color: var(--success);" onclick="downloadCertificate()">
                    <i class="fas fa-download"></i> Download Certificate
                </button>
            </div>
        ` : `
            <div style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: 24px; padding: 28px; margin-bottom: 24px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h3 style="color: white;">Next Achievement: ${nextAchievement?.name || "All Complete!"}</h3>
                        <p>${nextAchievement?.description || "Keep going!"}</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold;">${unlockedCount}/${nextAchievement?.requirement || 180}</div>
                        <div class="progress-bar-container" style="width: 200px; margin-top: 8px;">
                            <div class="progress-bar-fill" style="width: ${progressToNext}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `}
        
        <div style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px;">
            <h3><i class="fas fa-medal"></i> Your Achievements</h3>
            <div class="featured-grid" style="margin-top: 20px;">
                ${achievements.map(ach => `
                    <div class="featured-item" style="display: flex; align-items: center; gap: 12px; ${ach.earned ? 'background: var(--success); color: white;' : 'opacity: 0.6;'}">
                        <i class="fas ${ach.icon}" style="font-size: 24px;"></i>
                        <div style="text-align: left;">
                            <strong>${ach.name}</strong>
                            <small style="display: block;">${ach.earned ? '✓ Earned' : `${ach.progress}/${ach.requirement}`}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px;">
            <h3><i class="fas fa-chart-line"></i> Study Milestones</h3>
            <div style="margin-top: 20px;">
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Course Completion</span>
                        <span>${percentComplete}%</span>
                    </div>
                    <div class="progress-bar-container" style="height: 8px; margin-top: 6px;">
                        <div class="progress-bar-fill" style="width: ${percentComplete}%;"></div>
                    </div>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Lectures Unlocked</span>
                        <span>${unlockedCount}/${totalLectures}</span>
                    </div>
                    <div class="progress-bar-container" style="height: 8px; margin-top: 6px;">
                        <div class="progress-bar-fill" style="width: ${percentComplete}%;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Download certificate function
function downloadCertificate() {
    const percentComplete = Math.round(((window.userPurchases?.length || 0) / (window.allLectures?.length || 180)) * 100);
    if (percentComplete === 100) {
        const userName = window.currentUser?.user_metadata?.full_name || window.currentUser?.email?.split('@')[0] || 'NCLEX Candidate';
        const date = new Date().toLocaleDateString();
        
        // Create certificate HTML
        const certHtml = `
            <div style="width: 800px; height: 600px; border: 20px solid var(--primary); border-radius: 20px; padding: 40px; text-align: center; font-family: Arial;">
                <h1 style="color: var(--primary);">Jakiren NCLEX Nursing</h1>
                <h2>CERTIFICATE OF COMPLETION</h2>
                <p>This certificate is proudly presented to</p>
                <h3>${userName}</h3>
                <p>For successfully completing all 180 NCLEX Nursing Lectures</p>
                <p>Date: ${date}</p>
                <i class="fas fa-certificate" style="font-size: 48px; color: var(--primary);"></i>
            </div>
        `;
        
        // Create download
        const blob = new Blob([certHtml], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `NCLEX_Certificate_${userName}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        if (window.showToast) showToast('Certificate downloaded!', 'success');
    } else {
        if (window.showToast) showToast('Complete all lectures first!', 'error');
    }
}

// Expose to global window
window.renderCertificatesView = renderCertificatesView;
window.downloadCertificate = downloadCertificate;

console.log('✅ Certificates module loaded');
