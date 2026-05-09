// ============================================
// PROGRESS MODULE - Detailed Analytics
// ============================================

// Render detailed progress view
async function renderProgressView() {
    console.log('📊 Rendering progress view...');
    
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
    
    // Calculate progress by month
    const monthsData = [];
    for (let i = 1; i <= 6; i++) {
        const monthLectures = window.allLectures?.filter(l => l.month === i) || [];
        const monthUnlocked = monthLectures.filter(l => window.userPurchases?.includes(l.id)).length;
        const monthPercent = monthLectures.length > 0 ? Math.round((monthUnlocked / monthLectures.length) * 100) : 0;
        monthsData.push({ month: i, total: monthLectures.length, unlocked: monthUnlocked, percent: monthPercent });
    }
    
    contentDiv.innerHTML = `
        <div class="progress-overview" style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px;">
            <h2><i class="fas fa-chart-line"></i> Your NCLEX Progress</h2>
            <div class="progress-header" style="margin: 20px 0 10px;">
                <span class="progress-label">Overall Course Completion</span>
                <span class="progress-value">${percentComplete}%</span>
            </div>
            <div class="progress-bar-container" style="height: 20px;">
                <div class="progress-bar-fill" style="width: ${percentComplete}%; height: 100%;"></div>
            </div>
            <p style="margin-top: 16px; color: var(--gray);">
                <i class="fas fa-check-circle" style="color: var(--success);"></i> 
                ${unlockedCount} of ${totalLectures} lectures completed
            </p>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-clock"></i></div>
                <div class="stat-number">${Math.floor(unlockedCount * 2)} hrs</div>
                <div class="stat-label">Study Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-fire"></i></div>
                <div class="stat-number">${Math.floor(percentComplete / 10)}</div>
                <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-trophy"></i></div>
                <div class="stat-number">${Math.floor(percentComplete / 20)}</div>
                <div class="stat-label">Achievements</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper"><i class="fas fa-calendar"></i></div>
                <div class="stat-number">${Math.ceil((totalLectures - unlockedCount) / 5)}</div>
                <div class="stat-label">Est. Days Left</div>
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px; margin-bottom: 24px;">
            <h3><i class="fas fa-chart-simple"></i> Progress by Month</h3>
            <div style="margin-top: 20px;">
                ${monthsData.map(month => `
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span><strong>${getMonthName(month.month)}</strong></span>
                            <span>${month.unlocked}/${month.total} lectures (${month.percent}%)</span>
                        </div>
                        <div class="progress-bar-container" style="height: 10px;">
                            <div class="progress-bar-fill" style="width: ${month.percent}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light));"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="background: white; border-radius: 24px; padding: 28px;">
            <h3><i class="fas fa-lightbulb"></i> Study Recommendations</h3>
            <div class="featured-grid" style="margin-top: 16px;">
                ${monthsData.filter(m => m.percent < 50).slice(0, 3).map(m => `
                    <div class="featured-item" style="background: #fff3e0;">
                        <i class="fas fa-book"></i> Focus on ${getMonthName(m.month)}
                    </div>
                `).join('')}
                ${monthsData.filter(m => m.percent >= 50 && m.percent < 100).slice(0, 2).map(m => `
                    <div class="featured-item" style="background: #e8f5e9;">
                        <i class="fas fa-check-circle"></i> Review ${getMonthName(m.month)}
                    </div>
                `).join('')}
                ${monthsData.every(m => m.percent === 100) ? `
                    <div class="featured-item" style="background: var(--success); color: white;">
                        <i class="fas fa-star"></i> Ready for NCLEX Exam!
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Expose to global window
window.renderProgressView = renderProgressView;
window.showProgress = renderProgressView;

console.log('✅ Progress module loaded');
