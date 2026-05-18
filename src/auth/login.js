const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageContainer = document.getElementById("message-container");

function displayMessage(message, type) {
  messageContainer.textContent = message;
  
  const baseClasses = "p-4 mb-4 text-sm rounded-lg border font-medium transition-all duration-300";
  const typeStyles = {
    success: "text-green-800 border-green-300 bg-green-50",
    error: "text-red-800 border-red-300 bg-red-50",
    info: "text-blue-800 border-blue-300 bg-blue-50"
  };
  messageContainer.className = `${baseClasses} ${typeStyles[type] || typeStyles.info}`;
}

function isValidEmail(email) {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  return password.length >= 8;
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!isValidEmail(email)) {
    displayMessage("Invalid email format.", "error");
    return;
  }
  
  if (!isValidPassword(password)) {
    displayMessage("Password must be at least 8 characters.", "error");
    return;
  }

  displayMessage("Logging in...", "info");

  try {
    const response = await fetch('api/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      displayMessage(result.message || 'Login successful!', 'success');
      emailInput.value = '';
      passwordInput.value = '';
      return;
    }

    displayMessage(result.message || 'Login failed.', 'error');
  } catch (error) {
    displayMessage('Unable to contact the server. Please try again.', 'error');
    console.error('Login error:', error);
  }
}

function setupLoginForm() {
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

setupLoginForm();
