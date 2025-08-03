// src/supabase/auth.js
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidas')
        }
        
        supabase = createClient(supabaseUrl, supabaseKey)
    }
    return supabase
}

export async function cadastro(email, senha) {
    try {
        const client = getSupabaseClient()  // ✅ Só cria quando precisar
        
        let { data, error } = await client.auth.signUp({
            email: email,
            password: senha
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}