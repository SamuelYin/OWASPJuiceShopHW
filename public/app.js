function showMessage (elementId, message, isError = true) {
  const el = document.getElementById(elementId)
  el.textContent = message
  el.classList.toggle('error', isError)
  el.classList.toggle('success', !isError)
}

function validateEmail (email) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)
}

function validatePassword (password) {
  return password.trim().length >= 8
}

function validateClientSide (email, password) {
  if (!email || !password) {
    return 'Email and password are required.'
  }

  if (!validateEmail(email)) {
    return 'Email must contain @.'
  }

  if (!validatePassword(password)) {
    return 'Password must be at least 8 characters.'
  }

  return ''
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault()

  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const error = validateClientSide(email, password)

  if (error) {
    showMessage('loginError', error, true)
    return
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      showMessage('loginError', data.message || 'Login failed.', true)
      return
    }

    showMessage('loginError', `${data.message} Welcome, ${data.user.email}.`, false)
  } catch (error) {
    showMessage('loginError', 'Unable to reach the server. Please try again.', true)
  }
})

document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault()

  const email = document.getElementById('registerEmail').value.trim()
  const password = document.getElementById('registerPassword').value
  const role = document.getElementById('registerRole').value.trim()
  const error = validateClientSide(email, password)

  if (error) {
    showMessage('registerError', error, true)
    return
  }

  if (role && role.toLowerCase() === 'admin') {
    showMessage('registerError', 'Public registration cannot create admin users.', true)
    return
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    })

    const data = await response.json()

    if (!response.ok) {
      showMessage('registerError', data.message || 'Registration failed.', true)
      return
    }

    showMessage('registerError', data.message, false)
  } catch (error) {
    showMessage('registerError', 'Unable to reach the server. Please try again.', true)
  }
})

document.getElementById('searchForm').addEventListener('submit', async (event) => {
  event.preventDefault()

  const query = document.getElementById('searchQuery').value.trim()
  const resultsList = document.getElementById('searchResults')
  resultsList.innerHTML = ''

  if (!query) {
    resultsList.innerHTML = '<li>Enter a search term.</li>'
    return
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      resultsList.innerHTML = '<li>No products found.</li>'
      return
    }

    data.results.forEach((item) => {
      const li = document.createElement('li')
      li.textContent = `${item.name} - ${item.description}`
      resultsList.appendChild(li)
    })
  } catch (error) {
    resultsList.innerHTML = '<li>Search failed.</li>'
  }
})
