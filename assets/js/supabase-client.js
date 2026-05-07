// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            APP_CONFIG.SUPABASE_URL,
            APP_CONFIG.SUPABASE_ANON_KEY
        );
    }
    return supabaseClient;
}

window.supabase = initSupabase();

// Check connection
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('lectures').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
}
