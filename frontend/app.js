// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : 'https://3000-isvmc3ntsbz89uqydixia-6532622b.e2b.dev';  // Current sandbox backend URL

// Global state
let currentUser = null;
let currentNotes = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkExistingLogin();
});

// Check if user is already logged in
function checkExistingLogin() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            showDashboard();
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            logout();
        }
    }
}

// Login function
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showAlert('Logging in...', 'info');
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
        });
        
        if (response.data.success) {
            const { token, user } = response.data.data;
            
            // Store authentication data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));
            
            // Set default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            currentUser = user;
            showAlert('Login successful!', 'success');
            showDashboard();
        } else {
            showAlert(response.data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.response) {
            showAlert(error.response.data.error || 'Login failed', 'error');
        } else {
            showAlert('Network error. Please check your connection.', 'error');
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    delete axios.defaults.headers.common['Authorization'];
    currentUser = null;
    currentNotes = [];
    
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('user-nav').style.display = 'none';
    
    // Reset form
    document.getElementById('login-form').reset();
    
    showAlert('Logged out successfully', 'info');
}

// Show dashboard
async function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('user-nav').style.display = 'flex';
    
    // Update UI with user info
    document.getElementById('user-info').textContent = 
        `${currentUser.email} (${currentUser.role}) - ${currentUser.tenant.name}`;
    
    document.getElementById('tenant-info').textContent = 
        `Welcome to ${currentUser.tenant.name} (${currentUser.tenant.slug})`;
    
    // Load subscription info and notes
    await loadSubscriptionInfo();
    await loadNotes();
}

// Load subscription information
async function loadSubscriptionInfo() {
    try {
        const response = await axios.get(`${API_BASE_URL}/tenants/${currentUser.tenant.slug}/subscription`);
        
        if (response.data.success) {
            const sub = response.data.data;
            
            let statusHTML = `
                <div class="text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <span class="text-sm font-medium ${sub.plan === 'pro' ? 'text-green-600' : 'text-blue-600'}">
                            ${sub.plan === 'pro' ? '⭐ Pro Plan' : '🆓 Free Plan'}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${sub.note_count}${sub.note_limit ? `/${sub.note_limit}` : ''} notes
                    </div>
                </div>
            `;
            
            document.getElementById('subscription-status').innerHTML = statusHTML;
            
            // Show upgrade button if on free plan and user is admin
            const upgradeBtn = document.getElementById('upgrade-btn');
            if (sub.can_upgrade && currentUser.role === 'admin') {
                upgradeBtn.style.display = 'block';
                
                if (sub.limit_reached) {
                    upgradeBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Upgrade Now (Limit Reached)';
                    upgradeBtn.classList.add('animate-pulse');
                }
            } else {
                upgradeBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading subscription info:', error);
    }
}

// Load notes
async function loadNotes() {
    try {
        const response = await axios.get(`${API_BASE_URL}/notes`);
        
        if (response.data.success) {
            currentNotes = response.data.data;
            renderNotes();
        } else {
            showAlert('Failed to load notes', 'error');
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showAlert('Error loading notes', 'error');
    }
}

// Render notes in the UI
function renderNotes() {
    const container = document.getElementById('notes-container');
    
    if (currentNotes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-sticky-note text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg mb-2">No notes yet</p>
                <p class="text-gray-400 text-sm">Create your first note above to get started!</p>
            </div>
        `;
        return;
    }
    
    const notesHTML = currentNotes.map(note => `
        <div class="note-card bg-gray-50 rounded-lg p-4 mb-4 fade-in">
            <div class="flex justify-between items-start mb-2">
                <h4 class="text-lg font-semibold text-gray-900">${escapeHtml(note.title)}</h4>
                <div class="flex space-x-2">
                    <button 
                        onclick="editNote('${note.id}')" 
                        class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button 
                        onclick="deleteNote('${note.id}')" 
                        class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="text-gray-700 mb-3">${escapeHtml(note.content)}</p>
            <div class="text-xs text-gray-500">
                <i class="fas fa-clock mr-1"></i>
                Created: ${new Date(note.created_at).toLocaleDateString()} ${new Date(note.created_at).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = notesHTML;
}

// Create new note
async function createNote(event) {
    event.preventDefault();
    
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    
    if (!title || !content) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}/notes`, {
            title,
            content
        });
        
        if (response.data.success) {
            showAlert('Note created successfully!', 'success');
            document.getElementById('create-note-form').reset();
            await loadNotes();
            await loadSubscriptionInfo(); // Refresh subscription info to update count
        } else {
            if (response.data.limit_reached) {
                showAlert(`Note limit reached! ${response.data.error}`, 'warning');
            } else {
                showAlert(response.data.error || 'Failed to create note', 'error');
            }
        }
    } catch (error) {
        console.error('Error creating note:', error);
        if (error.response && error.response.data) {
            if (error.response.data.limit_reached) {
                showAlert(`Note limit reached! ${error.response.data.error}`, 'warning');
            } else {
                showAlert(error.response.data.error || 'Failed to create note', 'error');
            }
        } else {
            showAlert('Network error. Please try again.', 'error');
        }
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        const response = await axios.delete(`${API_BASE_URL}/notes/${noteId}`);
        
        if (response.data.success) {
            showAlert('Note deleted successfully!', 'success');
            await loadNotes();
            await loadSubscriptionInfo(); // Refresh subscription info to update count
        } else {
            showAlert(response.data.error || 'Failed to delete note', 'error');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showAlert('Failed to delete note', 'error');
    }
}

// Edit note (simplified implementation)
function editNote(noteId) {
    const note = currentNotes.find(n => n.id === noteId);
    if (!note) return;
    
    const newTitle = prompt('Edit title:', note.title);
    if (newTitle === null) return; // User cancelled
    
    const newContent = prompt('Edit content:', note.content);
    if (newContent === null) return; // User cancelled
    
    updateNote(noteId, newTitle, newContent);
}

// Update note
async function updateNote(noteId, title, content) {
    try {
        const response = await axios.put(`${API_BASE_URL}/notes/${noteId}`, {
            title,
            content
        });
        
        if (response.data.success) {
            showAlert('Note updated successfully!', 'success');
            await loadNotes();
        } else {
            showAlert(response.data.error || 'Failed to update note', 'error');
        }
    } catch (error) {
        console.error('Error updating note:', error);
        showAlert('Failed to update note', 'error');
    }
}

// Upgrade to Pro
async function upgradeToPro() {
    if (!confirm('Upgrade to Pro plan? This will remove the 3-note limit.')) {
        return;
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}/tenants/${currentUser.tenant.slug}/upgrade`);
        
        if (response.data.success) {
            showAlert('Successfully upgraded to Pro! 🎉', 'success');
            currentUser.tenant.subscription_plan = 'pro';
            localStorage.setItem('user_data', JSON.stringify(currentUser));
            await loadSubscriptionInfo();
        } else {
            showAlert(response.data.error || 'Failed to upgrade', 'error');
        }
    } catch (error) {
        console.error('Error upgrading:', error);
        if (error.response && error.response.status === 403) {
            showAlert('Only administrators can upgrade the subscription', 'error');
        } else {
            showAlert('Failed to upgrade subscription', 'error');
        }
    }
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    
    const alertId = 'alert-' + Date.now();
    const alertColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const alertHTML = `
        <div id="${alertId}" class="alert ${alertColors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-2 transform transition-all duration-300 translate-x-full">
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="removeAlert('${alertId}')" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Animate in
    setTimeout(() => {
        document.getElementById(alertId).classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeAlert(alertId);
    }, 5000);
}

// Remove alert
function removeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.add('translate-x-full');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}