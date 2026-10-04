# Secure Demo: SQL Injection, Admin Registration, and XSS Fixes

This project is a small demonstration app that shows how to fix three common web-security issues:

- SQL injection
- insecure admin registration
- cross-site scripting (XSS)

It includes:

- a login form with client-side validation
- a registration form that blocks admin-role escalation
- a product search endpoint that uses parameterized SQL queries
- a frontend search UI that renders data safely with textContent instead of innerHTML

## What it does

The app uses an in-memory SQLite database and an Express server. It supports:

- `POST /api/login` for login
- `POST /api/register` for public registration
- `GET /api/search?q=...` for safe product searching

## Security fixes included

### 1. SQL Injection
The search endpoint uses parameterized queries rather than string concatenation.

### 2. Admin Registration
Public registration rejects any attempt to create an `admin` role. The server always assigns the role `user`.

### 3. XSS
The frontend uses `textContent` instead of `innerHTML` when rendering search results so malicious payloads are treated as plain text.

## Run it locally

1. Open a terminal in this project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

4. Open your browser to:

```text
http://localhost:3000
```

## Notes

This project is intentionally small and educational. It is designed to demonstrate secure coding patterns without the complexity of a full production application.
