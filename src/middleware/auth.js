// src/middleware/auth.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://dazczejlredrhvwjdzyt.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhemN6ZWpscmVkcmh2d2pkenl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzk2NjQsImV4cCI6MjA2OTY1NTY2NH0.to31DN7qbgCMS23S81nDJykFS_H7iydQK0zNxqFe7a4'
)

// Middleware para verificar autenticação via header Authorization
export async function verificarAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.redirect('/login')
        }
        
        const token = authHeader.split(' ')[1]
        
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (error || !user) {
            return res.redirect('/login')
        }
        
        req.user = user
        next()
        
    } catch (error) {
        console.error('Erro na verificação de auth:', error)
        res.redirect('/login')
    }
}

// Middleware mais simples - só redireciona para páginas protegidas
export function protegerRota(req, res, next) {
    // Vamos deixar o cliente (JavaScript) fazer a verificação
    // Este middleware só serve a página e o JS decide se mostra o conteúdo
    next()
}