// ============================================
// Conexão com Supabase
// js/supabase-client.js
// ============================================
// IMPORTANTE: Substitua pela SUA URL e SUA Key do Supabase
// Encontre em: https://supabase.com/dashboard/project/_/settings/api

const SUPABASE_URL = 'https://fwzwiovycsphfrcfrjad.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Rv3ia0kJOieOeSaj4sIKXg_rLl_sk9L';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exporta para uso nos outros módulos
window.supabaseClient = supabase;
console.log('✅ Supabase conectado');