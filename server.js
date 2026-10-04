const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const db = new sqlite3.Database(':memory:')

function validateEmail (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword (password) {
  return typeof password === 'string' && password.trim().length >= 8
}

function safeJsonResponse (res, status, payload) {
  res.status(status).json(payload)
}

db.serialize(() => {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )
  `)

  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `)

  db.run(
    'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
    ['admin@demo.local', 'AdminSecure123!', 'admin']
  )

  const seededProducts = [
    ['Laptop Sleeve', 'Protective sleeve for notebooks and ultrabooks'],
    ['Wireless Mouse', 'Ergonomic mouse with USB receiver'],
    ['Security Book', 'Guide to secure coding and app hardening'],
    ['Gift Card', 'Redeemable voucher for online purchases'],
    ['Coffee Mug', 'Reusable ceramic mug with branded logo']
  ]

  const insertProduct = db.prepare('INSERT INTO products (name, description) VALUES (?, ?)')
  seededProducts.forEach(([name, description]) => insertProduct.run(name, description))
  insertProduct.finalize()
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Demo backend is running.' })
})

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim()
  const password = String(req.body.password || '')

  if (!email || !password) {
    return safeJsonResponse(res, 400, { message: 'Email and password are required.' })
  }

  if (!validateEmail(email)) {
    return safeJsonResponse(res, 400, { message: 'Email must contain @.' })
  }

  if (!validatePassword(password)) {
    return safeJsonResponse(res, 400, { message: 'Password must be at least 8 characters.' })
  }

  const query = 'SELECT id, email, role FROM users WHERE email = ? AND password = ?'

  db.get(query, [email, password], (err, row) => {
    if (err) {
      return safeJsonResponse(res, 500, { message: 'Login failed due to a database error.' })
    }

    if (!row) {
      return safeJsonResponse(res, 401, { message: 'Invalid email or password.' })
    }

    return safeJsonResponse(res, 200, {
      message: 'Login successful.',
      user: {
        id: row.id,
        email: row.email,
        role: row.role
      }
    })
  })
})

app.post('/api/register', (req, res) => {
  const email = String(req.body.email || '').trim()
  const password = String(req.body.password || '')
  const requestedRole = String(req.body.role || '').trim().toLowerCase()
  const requestedAdminFlag = String(req.body.isAdmin || '').toLowerCase() === 'true'

  if (!email || !password) {
    return safeJsonResponse(res, 400, { message: 'Email and password are required.' })
  }

  if (!validateEmail(email)) {
    return safeJsonResponse(res, 400, { message: 'Email must contain @.' })
  }

  if (!validatePassword(password)) {
    return safeJsonResponse(res, 400, { message: 'Password must be at least 8 characters.' })
  }

  if (requestedRole === 'admin' || requestedAdminFlag) {
    return safeJsonResponse(res, 403, {
      message: 'Admin role cannot be requested from public registration. Contact an administrator.'
    })
  }

  const insertSql = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)' 

  db.run(insertSql, [email, password, 'user'], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return safeJsonResponse(res, 409, { message: 'That email is already registered.' })
      }
      return safeJsonResponse(res, 500, { message: 'Registration failed.' })
    }

    return safeJsonResponse(res, 201, {
      message: 'Registration successful.',
      user: {
        id: this.lastID,
        email,
        role: 'user'
      }
    })
  })
})

app.get('/api/search', (req, res) => {
  const query = String(req.query.q || '').trim()

  if (!query) {
    return safeJsonResponse(res, 200, { results: [] })
  }

  const sql = 'SELECT id, name, description FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY name LIMIT 10'
  const pattern = `%${query}%`

  db.all(sql, [pattern, pattern], (err, rows) => {
    if (err) {
      return safeJsonResponse(res, 500, { message: 'Product search failed.' })
    }

    return safeJsonResponse(res, 200, { results: rows })
  })
})

app.listen(port, () => {
  console.log(`Secure demo running at http://localhost:${port}`)
})
