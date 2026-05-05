// ============================================
// JAKIREN NCLEX NURSING - CONFIGURATION
// ============================================
 
const APP_CONFIG = {
    // Supabase Credentials
    SUPABASE_URL: 'https://fbsnnsnebzzedypqbbip.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic25uc25lYnp6ZWR5cHFiYmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzY0NzAsImV4cCI6MjA5MzU1MjQ3MH0.9S0RCSCmdYkwJCi1WM-_75-1LKucxL4y-HNMMexB1Fk',
    
    // App Settings
    APP_NAME: 'Jakiren NCLEX Nursing',
    APP_VERSION: '1.0.0',
    
    // Course Settings
    TOTAL_LECTURES: 180,
    LECTURES_PER_MONTH: 30,
    TOTAL_MONTHS: 6,
    LECTURE_PRICE: 30,
    BUNDLE_PRICE: 60,
    
    // Storage Keys
    STORAGE_KEYS: {
        USER: 'jakiren_user',
        THEME: 'jakiren_theme'
    }
};

// Freeze config to prevent modifications
Object.freeze(APP_CONFIG);
