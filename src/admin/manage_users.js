let users = [];
let initialized = false;
const currentUserId = 1;

const userTableBody = document.getElementById('user-table-body');
const addUserForm = document.getElementById('add-user-form');
const passwordForm = document.getElementById('password-form');
const searchInput = document.getElementById('search-input');
const tableHeaders = document.querySelectorAll('#user-table thead th');

function createUserRow(user) {
  const tr = document.createElement('tr');

  const nameTd = document.createElement('td');
  nameTd.textContent = user.name;
  tr.appendChild(nameTd);

  const emailTd = document.createElement('td');
  emailTd.textContent = user.email;
  tr.appendChild(emailTd);

  const adminTd = document.createElement('td');
  adminTd.textContent = Number(user.is_admin) === 1 ? 'Yes' : 'No';
  tr.appendChild(adminTd);

  const actionsTd = document.createElement('td');
  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'edit-btn';
  editButton.dataset.id = user.id;
  editButton.textContent = 'Edit';

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-btn';
  deleteButton.dataset.id = user.id;
  deleteButton.textContent = 'Delete';

  actionsTd.appendChild(editButton);
  actionsTd.appendChild(deleteButton);
  tr.appendChild(actionsTd);

  return tr;
}

function renderTable(userArray) {
  userTableBody.innerHTML = '';

  if (!userArray || userArray.length === 0) {
    return;
  }

  userArray.forEach(user => {
    userTableBody.appendChild(createUserRow(user));
  });
}

async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('current-password').value.trim();
  const newPassword = document.getElementById('new-password').value.trim();
  const confirmPassword = document.getElementById('confirm-password').value.trim();

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  passwordForm.reset();

  try {
    const response = await fetch('../api/index.php?action=change_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentUserId,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const result = await response.json();
    if (!response.ok || result.success === false) {
      alert(result.message || 'Unable to update password.');
      return;
    }

    alert('Password updated successfully!');
  } catch (error) {
    console.error(error);
    alert('Unable to update password. Please try again later.');
  }
}

async function handleAddUser(event) {
  event.preventDefault();

  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('default-password').value.trim();
  const is_admin = parseInt(document.getElementById('is-admin').value, 10);

  if (!name || !email || !password) {
    alert('Please fill out all required fields.');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  try {
    const response = await fetch('../api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, is_admin }),
    });

    const result = await response.json();
    if (!response.ok || result.success === false) {
      alert(result.message || 'Unable to add user.');
      return;
    }

    alert('User added successfully!');
    addUserForm.reset();
    await loadUsersAndInitialize();
  } catch (error) {
    console.error(error);
    alert('Unable to add user. Please try again later.');
  }
}

async function handleTableClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const id = button.dataset.id;
  if (!id) return;

  if (button.classList.contains('delete-btn')) {
    if (!confirm('Delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`../api/index.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        alert(result.message || 'Unable to delete user.');
        return;
      }

      users = users.filter(user => String(user.id) !== String(id));
      renderTable(users);
      alert('User deleted successfully.');
    } catch (error) {
      console.error(error);
      alert('Unable to delete user. Please try again later.');
    }

  } else if (button.classList.contains('edit-btn')) {
    alert('Edit user feature is not implemented yet.');
  }
}

function handleSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderTable(users);
    return;
  }

  const filtered = users.filter(user => {
    return (
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  renderTable(filtered);
}

function handleSort(event) {
  const th = event.currentTarget;
  const index = th.cellIndex;
  const map = { 0: 'name', 1: 'email', 2: 'is_admin' };
  const key = map[index];
  if (!key) return;

  const direction = th.dataset.sortDir === 'asc' ? 'desc' : 'asc';
  tableHeaders.forEach(header => {
    if (header !== th) {
      delete header.dataset.sortDir;
    }
  });
  th.dataset.sortDir = direction;

  users.sort((a, b) => {
    let compare = 0;
    if (key === 'is_admin') {
      compare = Number(a.is_admin) - Number(b.is_admin);
    } else {
      compare = String(a[key]).localeCompare(String(b[key]), undefined, { sensitivity: 'base' });
    }
    return direction === 'asc' ? compare : -compare;
  });

  renderTable(users);
}

async function loadUsersAndInitialize() {
  try {
    const response = await fetch('../api/index.php');
    if (!response.ok) {
      console.error('Failed to fetch users', response.status);
      alert('Unable to load users. Please refresh the page.');
      return;
    }

    const result = await response.json();
    if (!result.success) {
      alert(result.message || 'Unable to load users.');
      return;
    }

    users = Array.isArray(result.data) ? result.data : [];
    renderTable(users);

    if (!initialized) {
      passwordForm.addEventListener('submit', handleChangePassword);
      addUserForm.addEventListener('submit', handleAddUser);
      userTableBody.addEventListener('click', handleTableClick);
      searchInput.addEventListener('input', handleSearch);
      tableHeaders.forEach(header => header.addEventListener('click', handleSort));
      initialized = true;
    }
  } catch (error) {
    console.error(error);
    alert('Unable to load users. Please try again later.');
  }
}

loadUsersAndInitialize();
