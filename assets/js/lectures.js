// ============================================
// LECTURES MODULE
// ============================================

let allLectures = [];
let userPurchases = [];
let currentFilter = 'all';
let currentMonth = 'all';

// Load all lectures from Supabase
async function loadLectures() {
    try {
        const { data, error } = await supabase
            .from('lectures')
            .select('*')
            .order('lecture_number', { ascending: true });
        
        if (error) throw error;
        
        allLectures = data;
        return allLectures;
    } catch (error) {
        console.error('Error loading lectures:', error);
        showToast('Error loading lectures', 'error');
        return [];
    }
}

// Load user's purchased lectures
async function loadUserPurchases() {
    if (!currentUser) return [];
    
    try {
        const { data, error } = await supabase
            .from('user_purchases')
            .select('lecture_id')
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        userPurchases = data.map(p => p.lecture_id);
        return userPurchases;
    } catch (error) {
        console.error('Error loading purchases:', error);
        return [];
    }
}

// Check if user has access to lecture
function hasAccess(lecture) {
    return lecture.is_free || userPurchases.includes(lecture.id);
}

// Render lectures grid
async function renderLectures() {
    const grid = document.getElementById('lecturesGrid');
    if (!grid) return;
    
    if (allLectures.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 50px; color: white;">Loading lectures...</div>';
        return;
    }
    
    let filteredLectures = [...allLectures];
    
    // Apply month filter
    if (currentMonth !== 'all') {
        filteredLectures = filteredLectures.filter(l => l.month === parseInt(currentMonth));
    }
    
    // Apply status filter
    if (currentFilter === 'unlocked') {
        filteredLectures = filteredLectures.filter(l => userPurchases.includes(l.id));
    } else if (currentFilter === 'locked') {
        filteredLectures = filteredLectures.filter(l => !userPurchases.includes(l.id) && !l.is_free);
    }
    
    if (filteredLectures.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 50px; color: white;">No lectures found</div>';
        return;
    }
    
    grid.innerHTML = filteredLectures.map(lecture => {
        const access = hasAccess(lecture);
        const isPurchased = userPurchases.includes(lecture.id);
        
        let badge = '';
        if (lecture.is_free) {
            badge = '<span class="badge badge-free">🎁 FREE</span>';
        } else if (isPurchased) {
            badge = '<span class="badge badge-unlocked">✅ UNLOCKED</span>';
        } else {
            badge = '<span class="badge badge-locked">🔒 LOCKED</span>';
        }
        
        let priceHtml = '';
        if (!lecture.is_free && !isPurchased) {
            if (lecture.lecture_number === 2) {
                priceHtml = `<div class="lecture-price">🔥 SPECIAL: ${formatCurrency(lecture.price)}<br><small>Then ${formatCurrency(APP_CONFIG.BUNDLE_PRICE)} for all</small></div>`;
            } else {
                priceHtml = `<div class="lecture-price">${formatCurrency(lecture.price)} <small>one-time</small></div>`;
            }
        }
        
        return `
            <div class="lecture-card ${!access ? 'locked' : ''}">
                ${badge}
                <div class="lecture-number">Lecture ${lecture.lecture_number} • ${getMonthName(lecture.month)}</div>
                <div class="lecture-title">${lecture.title}</div>
                <div class="lecture-duration">⏱️ ${lecture.duration || '2 hours'}</div>
                ${priceHtml}
                ${access ? 
                    `<button class="watch-btn" onclick="watchLecture(${lecture.id})">🎥 Watch Lecture</button>` : 
                    `<button class="unlock-btn" onclick="initPayment(${JSON.stringify(lecture).replace(/"/g, '&quot;')})">🔓 Unlock ${formatCurrency(lecture.price)}</button>`
                }
            </div>
        `;
    }).join('');
}

// Watch lecture
async function watchLecture(lectureId) {
    const lecture = allLectures.find(l => l.id === lectureId);
    if (!lecture) return;
    
    if (!hasAccess(lecture)) {
        showToast('Please purchase this lecture first', 'error');
        return;
    }
    
    const modal = document.getElementById('videoModal');
    const header = document.getElementById('videoHeader');
    const container = document.getElementById('videoContainer');
    const notes = document.getElementById('videoNotes');
    
    if (header) {
        header.innerHTML = `
            <h2>${lecture.title}</h2>
            <p style="color: var(--gray); margin-top: 5px;">${lecture.duration || '2 hours'} • ${getMonthName(lecture.month)}</p>
        `;
    }
    
    if (container) {
        container.innerHTML = `
            <iframe 
                src="${lecture.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    }
    
    if (notes) {
        notes.innerHTML = `
            <div style="margin-top: 16px; padding: 16px; background: var(--light-gray); border-radius: var(--radius-sm);">
                <strong>📚 Study Notes:</strong><br>
                ${lecture.study_notes || 'Complete NCLEX study guide with practice questions and detailed rationales.'}
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

// Filter functions
function filterLectures(filter) {
    currentFilter = filter;
    
    // Update active button state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(filter) || 
            (filter === 'all' && btn.textContent === 'All') ||
            (filter === 'unlocked' && btn.textContent === 'Unlocked') ||
            (filter === 'locked' && btn.textContent === 'Locked')) {
            btn.classList.add('active');
        }
    });
    
    renderLectures();
}

function filterByMonth() {
    const select = document.getElementById('monthFilter');
    if (select) {
        currentMonth = select.value;
        renderLectures();
    }
}
