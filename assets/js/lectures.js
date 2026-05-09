// ============================================
// LECTURES MODULE - WITH SEARCH & NOTES
// ============================================

let allLectures = [];
let userPurchases = [];
let currentFilter = 'all';
let currentMonth = 'all';
let currentSearchTerm = '';

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
        if (window.showToast) showToast('Error loading lectures', 'error');
        return [];
    }
}

// Load user's purchased lectures
async function loadUserPurchases() {
    if (!window.currentUser) return [];
    
    try {
        const { data, error } = await supabase
            .from('user_purchases')
            .select('lecture_id')
            .eq('user_id', window.currentUser.id);
        
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

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
        const later = () => {
            clearTimeout(timeout);
            func();
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add search bar to filter bar
function addSearchToLectures() {
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar && !document.querySelector('.search-bar')) {
        const searchHtml = `
            <div class="search-bar" style="flex: 1; min-width: 200px;">
                <input type="text" id="lectureSearch" placeholder="🔍 Search lectures by title..." autocomplete="off" style="width: 100%; padding: 10px 16px; border-radius: 40px; border: 2px solid var(--light-gray);">
            </div>
        `;
        filterBar.insertAdjacentHTML('afterbegin', searchHtml);
        
        const searchInput = document.getElementById('lectureSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                currentSearchTerm = searchInput.value.toLowerCase();
                renderLectures();
            }, 300));
        }
    }
}

// ========== PERSONAL NOTES FOR LECTURES ==========
async function saveLectureNotes(lectureId, notes) {
    if (!window.currentUser) return;
    
    try {
        // Check if notes table exists, if not create it
        const { error } = await supabase
            .from('user_notes')
            .upsert({ 
                user_id: window.currentUser.id, 
                lecture_id: lectureId, 
                notes: notes,
                updated_at: new Date()
            });
        
        if (error) {
            // If table doesn't exist, store in localStorage as fallback
            const notesKey = `notes_${window.currentUser.id}_${lectureId}`;
            localStorage.setItem(notesKey, notes);
            if (window.showToast) showToast('📝 Notes saved locally!');
        } else {
            if (window.showToast) showToast('📝 Notes saved!');
        }
    } catch (error) {
        // Fallback to localStorage
        const notesKey = `notes_${window.currentUser.id}_${lectureId}`;
        localStorage.setItem(notesKey, notes);
        if (window.showToast) showToast('📝 Notes saved locally!');
    }
}

async function loadLectureNotes(lectureId) {
    if (!window.currentUser) return '';
    
    try {
        const { data, error } = await supabase
            .from('user_notes')
            .select('notes')
            .eq('user_id', window.currentUser.id)
            .eq('lecture_id', lectureId)
            .single();
        
        if (data && data.notes) return data.notes;
    } catch (error) {
        // Try localStorage as fallback
        const notesKey = `notes_${window.currentUser.id}_${lectureId}`;
        const localNotes = localStorage.getItem(notesKey);
        if (localNotes) return localNotes;
    }
    
    return '';
}

// Render lectures grid
async function renderLectures() {
    const grid = document.getElementById('lecturesGrid');
    if (!grid) {
        // If grid doesn't exist, create the structure first
        const contentDiv = document.getElementById('dynamicContent');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="filter-bar">
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all" onclick="filterLectures('all')">
                            <i class="fas fa-list"></i> All Lectures
                        </button>
                        <button class="filter-btn" data-filter="unlocked" onclick="filterLectures('unlocked')">
                            <i class="fas fa-check-circle"></i> Unlocked
                        </button>
                        <button class="filter-btn" data-filter="locked" onclick="filterLectures('locked')">
                            <i class="fas fa-lock"></i> Locked
                        </button>
                    </div>
                    <select id="monthFilter" class="month-select" onchange="filterByMonth()">
                        <option value="all">📅 All Months</option>
                        <option value="1">📘 Month 1: Fundamentals</option>
                        <option value="2">💉 Month 2: Medical-Surgical</option>
                        <option value="3">💊 Month 3: Pharmacology</option>
                        <option value="4">🤰 Month 4: Maternity & Pediatrics</option>
                        <option value="5">🧠 Month 5: Psychiatric Nursing</option>
                        <option value="6">⭐ Month 6: Final Review</option>
                    </select>
                </div>
                <div class="lectures-grid" id="lecturesGrid">
                    <div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading lectures...</div>
                </div>
            `;
        }
        // Add search after creating structure
        setTimeout(() => addSearchToLectures(), 100);
    }
    
    const gridElement = document.getElementById('lecturesGrid');
    if (!gridElement) return;
    
    if (allLectures.length === 0) {
        await loadLectures();
        await loadUserPurchases();
    }
    
    if (allLectures.length === 0) {
        gridElement.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--gray);">No lectures available</div>';
        return;
    }
    
    let filteredLectures = [...allLectures];
    
    // Apply search filter
    if (currentSearchTerm) {
        filteredLectures = filteredLectures.filter(l => 
            l.title.toLowerCase().includes(currentSearchTerm) ||
            (l.description && l.description.toLowerCase().includes(currentSearchTerm))
        );
    }
    
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
        let message = 'No lectures found';
        if (currentSearchTerm) message = `No results for "${currentSearchTerm}"`;
        gridElement.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--gray);"><i class="fas fa-search"></i> ${message}</div>`;
        return;
    }
    
    // Show search results count
    const searchInfo = currentSearchTerm ? `<div style="margin-bottom: 16px; color: var(--gray);"><i class="fas fa-search"></i> Found ${filteredLectures.length} results for "${currentSearchTerm}"</div>` : '';
    
    gridElement.innerHTML = searchInfo + filteredLectures.map(lecture => {
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
                priceHtml = `<div class="lecture-price">🔥 SPECIAL: ${window.formatCurrency ? window.formatCurrency(lecture.price) : 'KES ' + lecture.price}<br><small>Then ${window.formatCurrency ? window.formatCurrency(APP_CONFIG?.BUNDLE_PRICE || 60) : 'KES 60'} for all</small></div>`;
            } else {
                priceHtml = `<div class="lecture-price">${window.formatCurrency ? window.formatCurrency(lecture.price) : 'KES ' + lecture.price} <small>one-time</small></div>`;
            }
        }
        
        return `
            <div class="lecture-card ${!access ? 'locked' : ''}">
                ${badge}
                <div class="lecture-number">Lecture ${lecture.lecture_number} • ${getMonthName(lecture.month)}</div>
                <div class="lecture-title">${highlightSearchTerm(lecture.title, currentSearchTerm)}</div>
                <div class="lecture-duration">⏱️ ${lecture.duration || '2 hours'}</div>
                ${priceHtml}
                ${access ? 
                    `<button class="watch-btn" onclick="watchLecture(${lecture.id})">🎥 Watch Lecture</button>` : 
                    `<button class="unlock-btn" onclick="initPayment(${JSON.stringify(lecture).replace(/"/g, '&quot;')})">🔓 Unlock ${window.formatCurrency ? window.formatCurrency(lecture.price) : 'KES ' + lecture.price}</button>`
                }
            </div>
        `;
    }).join('');
    
    // Update stats if function exists
    if (window.updateStats) window.updateStats();
}

// Helper function to highlight search terms
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--warning); color: var(--dark); padding: 0 4px; border-radius: 4px;">$1</mark>');
}

function getMonthName(month) {
    const months = {
        1: '📘 Fundamentals',
        2: '💉 Medical-Surgical',
        3: '💊 Pharmacology',
        4: '🤰 Maternity & Pediatrics',
        5: '🧠 Psychiatric Nursing',
        6: '⭐ Final Review'
    };
    return months[month] || `Month ${month}`;
}

// Updated watch lecture with personal notes
async function watchLecture(lectureId) {
    const lecture = allLectures.find(l => l.id === lectureId);
    if (!lecture) return;
    
    if (!hasAccess(lecture)) {
        if (window.showToast) showToast('Please purchase this lecture first', 'error');
        return;
    }
    
    // Record study activity for streak tracking
    if (window.recordStudyActivity) await window.recordStudyActivity();
    
    // Load saved notes
    const savedNotes = await loadLectureNotes(lectureId);
    
    const modal = document.getElementById('videoModal');
    const header = document.getElementById('videoHeader');
    const container = document.getElementById('videoContainer');
    const notes = document.getElementById('videoNotes');
    
    if (header) {
        header.innerHTML = `
            <h2><i class="fas fa-video"></i> ${lecture.title}</h2>
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
            <div style="margin-bottom: 16px; padding: 16px; background: var(--light-gray); border-radius: var(--radius-sm);">
                <strong>📚 Study Notes:</strong><br>
                ${lecture.study_notes || 'Complete NCLEX study guide with practice questions and detailed rationales.'}
            </div>
            <div style="border-top: 1px solid var(--light-gray); padding-top: 16px;">
                <strong><i class="fas fa-pen"></i> Your Personal Notes:</strong>
                <textarea id="personalNotes" rows="4" style="width: 100%; margin-top: 8px; padding: 12px; border-radius: 12px; border: 2px solid var(--light-gray); font-family: inherit; resize: vertical;">${escapeHtml(savedNotes)}</textarea>
                <button class="btn btn-primary" style="margin-top: 12px;" onclick="saveCurrentNotes(${lecture.id})">
                    <i class="fas fa-save"></i> Save Notes
                </button>
            </div>
        `;
    }
    
    if (modal) modal.style.display = 'flex';
}

// Save notes from video modal
window.saveCurrentNotes = async function(lectureId) {
    const notesTextarea = document.getElementById('personalNotes');
    if (notesTextarea) {
        await saveLectureNotes(lectureId, notesTextarea.value);
    }
};

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Filter functions
function filterLectures(filter) {
    currentFilter = filter;
    
    // Update active button state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnFilter = btn.getAttribute('data-filter');
        if (btnFilter === filter) {
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

// Clear search
function clearSearch() {
    currentSearchTerm = '';
    const searchInput = document.getElementById('lectureSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    renderLectures();
}

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL WINDOW OBJECT
// ============================================

// Main render function for navigation
window.renderLecturesView = async function() {
    console.log('📚 Rendering lectures view...');
    
    // Reset filters
    currentFilter = 'all';
    currentMonth = 'all';
    currentSearchTerm = '';
    
    // Ensure data is loaded
    if (allLectures.length === 0) {
        await loadLectures();
        await loadUserPurchases();
    }
    
    // Create the lectures UI structure
    const contentDiv = document.getElementById('dynamicContent');
    if (contentDiv) {
        contentDiv.innerHTML = `
            <div class="filter-bar">
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all" onclick="filterLectures('all')">
                        <i class="fas fa-list"></i> All Lectures
                    </button>
                    <button class="filter-btn" data-filter="unlocked" onclick="filterLectures('unlocked')">
                        <i class="fas fa-check-circle"></i> Unlocked
                    </button>
                    <button class="filter-btn" data-filter="locked" onclick="filterLectures('locked')">
                        <i class="fas fa-lock"></i> Locked
                    </button>
                </div>
                <select id="monthFilter" class="month-select" onchange="filterByMonth()">
                    <option value="all">📅 All Months</option>
                    <option value="1">📘 Month 1: Fundamentals</option>
                    <option value="2">💉 Month 2: Medical-Surgical</option>
                    <option value="3">💊 Month 3: Pharmacology</option>
                    <option value="4">🤰 Month 4: Maternity & Pediatrics</option>
                    <option value="5">🧠 Month 5: Psychiatric Nursing</option>
                    <option value="6">⭐ Month 6: Final Review</option>
                </select>
            </div>
            <div class="lectures-grid" id="lecturesGrid">
                <div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading lectures...</div>
            </div>
        `;
    }
    
    // Add search bar
    setTimeout(() => addSearchToLectures(), 100);
    
    // Render the lectures
    await renderLectures();
};

// Also expose individual functions
window.loadLectures = loadLectures;
window.loadUserPurchases = loadUserPurchases;
window.renderLectures = renderLectures;
window.watchLecture = watchLecture;
window.filterLectures = filterLectures;
window.filterByMonth = filterByMonth;
window.hasAccess = hasAccess;
window.clearSearch = clearSearch;
window.saveLectureNotes = saveLectureNotes;

// For backward compatibility
window.displayLectures = window.renderLecturesView;

console.log('✅ Lectures module loaded with search and notes features');
