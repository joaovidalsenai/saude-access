// src/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET

// 2.1 Registro
router.post('/register', async (req, res) => {
  const {
    cliente_nome,
    cliente_senha,
    cliente_cpf,
    cliente_nascimento,
    client_cep,
    cliente_telefone,
    cliente_email
  } = req.body

  if (!cliente_email || !cliente_senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' })
  }

  try {
    // 1. Hash da senha
    const saltRounds = 10
    const hash = await bcrypt.hash(cliente_senha, saltRounds)

    // 2. Inserção no banco
    const [result] = await pool.execute(
      `INSERT INTO cliente
        (cliente_nome, cliente_senha, cliente_cpf, cliente_nascimento,
         client_cep, cliente_telefone, cliente_email,
         cliente_data_cadastro, client_ativo)
       VALUES (?,?,?,?,?,?,?, NOW(), 1)`,
      [
        cliente_nome,
        hash,
        cliente_cpf,
        cliente_nascimento,
        client_cep,
        cliente_telefone,
        cliente_email
      ]
    )

    // 3. Retorno
    res.status(201).json({
      cliente_id: result.insertId,
      message: 'Conta criada com sucesso'
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao registrar usuário.' })
  }
})


// 2.2 Login
router.post('/login', async (req, res) => {
  const { cliente_email, cliente_senha } = req.body

  if (!cliente_email || !cliente_senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' })
  }

  try {
    // 1. Busca usuário ativo
    const [rows] = await pool.execute(
      `SELECT cliente_id, cliente_senha
         FROM cliente
        WHERE cliente_email = ? AND client_ativo = 1`,
      [cliente_email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    const user = rows[0]
    // 2. Verifica senha
    const match = await bcrypt.compare(cliente_senha, user.cliente_senha)
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    // 3. Gera JWT
    const token = jwt.sign(
      { cliente_id: user.cliente_id, email: cliente_email },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao fazer login.' })
  }
})

export default router