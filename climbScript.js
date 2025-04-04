// ======================
// DATA MANAGEMENT
// ======================

// Initialize user accounts
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

// Current user session
let currentUser = localStorage.getItem('currentUser');

// Climb data structure
let climbs = JSON.parse(localStorage.getItem('climbs')) || [];

// ======================
// AUTHENTICATION
// ======================

function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const isLogin = document.getElementById('formTitle').textContent === 'Login';
    const errorElement = document.getElementById('errorMessage');

    // Validation
    if (!username || !password) {
        errorElement.textContent = 'Please fill in all fields.';
        return;
    }

    if (isLogin) {
        // Login logic
        const account = accounts.find(acc => acc.username === username && acc.password === password);
        if (!account) {
            errorElement.textContent = 'Invalid username or password.';
            return;
        }
    } else {
        // Signup logic
        if (accounts.some(acc => acc.username === username)) {
            errorElement.textContent = 'Username already exists.';
            return;
        }
        if (password.length < 6) {
            errorElement.textContent = 'Password must be at least 6 characters.';
            return;
        }
        accounts.push({ username, password });
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }

    // Successful auth
    currentUser = username;
    localStorage.setItem('currentUser', username);
    window.location.href = 'index.html';
}

function toggleForm() {
    const formTitle = document.getElementById('formTitle');
    const authButton = document.getElementById('authButton');
    const toggleText = document.getElementById('toggleText');
    const errorElement = document.getElementById('errorMessage');

    errorElement.textContent = '';
    
    if (formTitle.textContent === 'Login') {
        formTitle.textContent = 'Sign Up';
        authButton.textContent = 'Sign Up';
        toggleText.innerHTML = 'Already have an account? <a href="#" onclick="toggleForm()">Login</a>';
    } else {
        formTitle.textContent = 'Login';
        authButton.textContent = 'Login';
        toggleText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleForm()">Sign Up</a>';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'climbSite.html';
}

function makeBioEditable() {
    const bioDisplay = document.getElementById('userBio');
    const bioEdit = document.getElementById('bioEdit');
    
    // Get current bio from localStorage or set default
    const currentBio = localStorage.getItem(`${currentUser}_bio`) || 
                      "Climbing enthusiast | Boulderer | Route addict";
    
    bioDisplay.style.display = 'none';
    bioEdit.style.display = 'block';
    bioEdit.value = currentBio;
    bioEdit.focus();
    
    // Handle when user clicks away or presses Enter
    bioEdit.onblur = saveBio;
    bioEdit.onkeydown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveBio();
        }
    };
}

function saveBio() {
    const bioDisplay = document.getElementById('userBio');
    const bioEdit = document.getElementById('bioEdit');
    const newBio = bioEdit.value.trim();
    
    bioDisplay.textContent = newBio || "Click to add a bio";
    localStorage.setItem(`${currentUser}_bio`, newBio);
    
    bioEdit.style.display = 'none';
    bioDisplay.style.display = 'block';
}
// ======================
// CORE FUNCTIONALITY
// ======================

// DOM Elements
const tabs = {
    bouldering: document.getElementById('bouldering-tab'),
    roped: document.getElementById('roped-tab'),
    projects: document.getElementById('projects-tab'),
    favorites: document.getElementById('favorites-tab'),
    analytics: document.getElementById('analytics-tab'),
    profile: document.getElementById('profile-tab')
};

// Initialize the app
function initApp() {
    if (!currentUser && window.location.pathname.includes('index.html')) {
        window.location.href = 'climbSite.html';
        return;
    }

    // Set up climb type toggle
    document.querySelectorAll('input[name="climbType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updateGradeOptions(this.value);
        });
    });

    // Load initial view
    showTab('bouldering', false);
    loadProfile();
}

// Show a specific tab
function showTab(tabName, fromClick = true) {
    // Hide all tabs
    Object.values(tabs).forEach(tab => {
        if (tab) tab.classList.remove('active');
    });
    
    // Show selected tab if it exists
    if (tabs[tabName]) {
        tabs[tabName].classList.add('active');
        
        // Update active nav link if called from click
        if (fromClick && event && event.target) {
            document.querySelectorAll('.nav-tabs a').forEach(link => {
                link.classList.remove('active');
            });
            event.target.classList.add('active');
        }
    }
    
    // Load content for the tab
    switch(tabName) {
        case 'profile':
            loadProfile();
            break;
        case 'analytics':
            initAnalytics();
            break;
        default:
            displayClimbs();
    }
}

// Update grade options based on climb type
function updateGradeOptions(climbType) {
    const isBoulder = climbType === 'boulder';
    document.querySelectorAll('.boulder-grade').forEach(opt => {
        opt.style.display = isBoulder ? 'block' : 'none';
    });
    document.querySelectorAll('.roped-grade').forEach(opt => {
        opt.style.display = isBoulder ? 'none' : 'block';
    });
    document.getElementById('gradeInput').value = '';
}

// ======================
// CLIMB MANAGEMENT
// ======================

function uploadMedia() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }
    
    const file = fileInput.files[0];
    const grade = document.getElementById('gradeInput').value;
    const styles = Array.from(document.querySelectorAll('input[name="style"]:checked')).map(el => el.value);
    const location = document.getElementById('locationInput').value;
    const color = document.getElementById('colorInput').value;
    const attempts = document.getElementById('attemptsInput').value;
    const climbDate = document.getElementById('dateInput').value;
    const notes = document.getElementById('notesInput').value;
    const climbType = document.querySelector('input[name="climbType"]:checked').value;

    // Validation
    if (!grade || !location || !color || !attempts || !climbDate || styles.length === 0) {
        alert('Please fill in all required fields.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const mediaUrl = e.target.result;
        const climbId = Date.now().toString();
        
        climbs.push({
            id: climbId,
            mediaUrl,
            grade,
            styles,
            location,
            color,
            attempts,
            date: climbDate,
            notes,
            username: currentUser,
            isProject: false,
            isFavorite: false,
            climbType,
            sendDate: null
        });
        
        saveClimbs();
        hideUploadPopup();
        displayClimbs();
    };
    
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
}

function displayClimbs() {
    const activeTab = document.querySelector('.tab-content.active').id;
    let filteredClimbs = climbs.filter(c => c.username === currentUser);
    let galleryId = 'gallery';

    // Filter based on active tab
    switch(activeTab) {
        case 'bouldering-tab':
            filteredClimbs = filteredClimbs.filter(c => c.climbType === 'boulder');
            galleryId = 'bouldering-gallery';
            break;
        case 'roped-tab':
            filteredClimbs = filteredClimbs.filter(c => c.climbType === 'roped');
            galleryId = 'roped-gallery';
            break;
        case 'projects-tab':
            filteredClimbs = filteredClimbs.filter(c => c.isProject);
            galleryId = 'projects-gallery';
            break;
        case 'favorites-tab':
            filteredClimbs = filteredClimbs.filter(c => c.isFavorite);
            galleryId = 'favorites-gallery';
            break;
    }

    // Sort by date (newest first)
    filteredClimbs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const gallery = document.getElementById(galleryId);
    gallery.innerHTML = '';

    if (filteredClimbs.length === 0) {
        gallery.innerHTML = `
            <div class="no-data" style="grid-column: 1/-1">
                <p>No climbs found. ${activeTab === 'projects-tab' ? 'Mark climbs as projects to see them here.' : 
                  activeTab === 'favorites-tab' ? 'Favorite climbs to see them here.' : 'Upload your first climb!'}</p>
            </div>
        `;
        return;
    }

    filteredClimbs.forEach(climb => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = climb.id;
        if (climb.isProject) card.style.borderLeft = '5px solid #e74c3c';
        if (climb.isFavorite) card.style.borderRight = '5px solid #f1c40f';

        // Create media element
        const media = climb.mediaUrl.startsWith('data:video') ? 
            document.createElement('video') : 
            document.createElement('img');
        media.src = climb.mediaUrl;
        media.className = 'thumbnail';
        if (media.tagName === 'VIDEO') media.controls = true;

        // Create details element
        const details = document.createElement('div');
        details.className = 'details';
        
        const formattedDate = new Date(climb.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        details.innerHTML = `
            <p><strong>${formattedDate}</strong></p>
            <p><strong>Grade:</strong> ${climb.grade} 
                <span class="grade-tag ${climb.climbType === 'boulder' ? 'boulder-grade-tag' : 'roped-grade-tag'}">
                    ${climb.climbType === 'boulder' ? 'Boulder' : 'Roped'}
                </span>
            </p>
            <p><strong>Styles:</strong> ${climb.styles.join(', ')}</p>
            <p><strong>Location:</strong> ${climb.location}</p>
            ${climb.attempts ? `<p><strong>Attempts:</strong> ${climb.attempts}</p>` : ''}
            ${climb.notes ? `<p><strong>Notes:</strong> ${climb.notes}</p>` : ''}
            ${climb.isProject ? `<p><strong>Status:</strong> 🎯 Project</p>` : ''}
        `;

        // Add action buttons
        const actions = document.createElement('div');
        actions.className = 'climb-actions';
        
        // Favorite button
        const favBtn = document.createElement('button');
        favBtn.className = 'btn';
        favBtn.innerHTML = climb.isFavorite ? '❤️ Unfavorite' : '🤍 Favorite';
        favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(climb.id);
        };

        // Project button
        const projectBtn = document.createElement('button');
        projectBtn.className = 'btn';
        projectBtn.innerHTML = climb.isProject ? '✅ Mark as Sent' : '🎯 Mark as Project';
        projectBtn.onclick = (e) => {
            e.stopPropagation();
            toggleProject(climb.id);
        };

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn';
        deleteBtn.style.background = '#e74c3c';
        deleteBtn.style.color = 'white';
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteClimb(climb.id);
        };

        actions.appendChild(favBtn);
        actions.appendChild(projectBtn);
        actions.appendChild(deleteBtn);
        details.appendChild(actions);

        card.appendChild(media);
        card.appendChild(details);
        gallery.appendChild(card);
    });
}

function toggleFavorite(climbId) {
    const climb = climbs.find(c => c.id === climbId);
    if (climb) {
        climb.isFavorite = !climb.isFavorite;
        saveClimbs();
        displayClimbs();
    }
}

function toggleProject(climbId) {
    const climb = climbs.find(c => c.id === climbId);
    if (climb) {
        climb.isProject = !climb.isProject;
        if (!climb.isProject) {
            // Marking as sent - record send date and attempts
            climb.sendDate = new Date().toISOString();
            const attempts = prompt('How many attempts did it take to send?', climb.attempts);
            if (attempts) climb.attempts = attempts;
        } else {
            // Marking as project - clear send date
            climb.sendDate = null;
        }
        saveClimbs();
        displayClimbs();
    }
}

function deleteClimb(climbId) {
    if (!confirm('Are you sure you want to delete this climb?')) return;
    climbs = climbs.filter(climb => climb.id !== climbId);
    saveClimbs();
    displayClimbs();
}

function saveClimbs() {
    localStorage.setItem('climbs', JSON.stringify(climbs));
}

// ======================
// PROFILE MANAGEMENT
// ======================

function loadProfile() {
    const userClimbs = climbs.filter(c => c.username === currentUser);
    
    // Set basic profile info
    document.getElementById('usernameDisplay').textContent = currentUser;
    
    // Load profile photo if exists
    const profilePic = localStorage.getItem(`${currentUser}_profilePic`);
    if (profilePic) {
        document.getElementById('userProfilePic').src = profilePic;
    }
    
    // Load bio if exists
    const userBio = localStorage.getItem(`${currentUser}_bio`);
    document.getElementById('userBio').textContent = userBio || "Click to add a bio";
    
    // Setup profile photo upload
    document.getElementById('profilePhotoInput').onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.getElementById('userProfilePic');
            img.src = event.target.result;
            localStorage.setItem(`${currentUser}_profilePic`, event.target.result);
        };
        reader.readAsDataURL(file);
    };
    
    // Calculate and display statistics
    calculateStats(userClimbs);
    
    // Show recent climbs
    displayRecentClimbs(userClimbs);
}

function calculateStats(userClimbs) {
    const totalClimbs = userClimbs.length;
    document.getElementById('totalClimbs').textContent = totalClimbs;
    
    if (totalClimbs === 0) {
        document.getElementById('hardestBoulder').textContent = 'none';
        document.getElementById('hardestRoped').textContent = 'none';
        document.getElementById('projectCount').textContent = '0';
        return;
    }
    
    // Boulder stats
    const boulderClimbs = userClimbs.filter(c => c.climbType === 'boulder');
    const boulderGrades = boulderClimbs.map(c => parseInt(c.grade.substring(1)) || 0);
    const hardestBoulder = boulderGrades.length > 0 ? Math.max(...boulderGrades) : 0;
    
    // Roped stats
    const ropedClimbs = userClimbs.filter(c => c.climbType === 'roped');
    const ropedGrades = ropedClimbs.map(c => {
        const gradeStr = c.grade.replace('5.', '');
        return parseFloat(gradeStr) || 0;
    });
    const hardestRoped = ropedGrades.length > 0 ? Math.max(...ropedGrades) : 0;
    
    // Projects
    const projectCount = userClimbs.filter(c => c.isProject).length;
    
    // Update DOM
    document.getElementById('hardestBoulder').textContent = `V${hardestBoulder}`;
    document.getElementById('hardestRoped').textContent = `5.${hardestRoped}`;
    document.getElementById('projectCount').textContent = projectCount;
}

function displayRecentClimbs(userClimbs) {
    const recentClimbsContainer = document.getElementById('recentClimbs');
    recentClimbsContainer.innerHTML = '';
    
    // Show last 6 climbs (non-projects)
    const recent = userClimbs
        .filter(c => !c.isProject)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);
    
    if (recent.length === 0) {
        recentClimbsContainer.innerHTML = `
            <div class="no-data" style="grid-column: 1/-1">
                <p>No completed climbs yet. Log some sends to see them here!</p>
            </div>
        `;
        return;
    }
    
    recent.forEach(climb => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const media = climb.mediaUrl.startsWith('data:video') ? 
            document.createElement('video') : 
            document.createElement('img');
        media.src = climb.mediaUrl;
        media.className = 'thumbnail';
        if (media.tagName === 'VIDEO') media.controls = true;
        
        const details = document.createElement('div');
        details.className = 'details';
        details.innerHTML = `
            <p><strong>${climb.grade}</strong> at ${climb.location}</p>
            <p>${new Date(climb.date).toLocaleDateString()}</p>
            <p>${climb.styles.join(', ')}</p>
        `;
        
        card.appendChild(media);
        card.appendChild(details);
        recentClimbsContainer.appendChild(card);
    });
}

// ======================
// ANALYTICS DASHBOARD
// ======================

function initAnalytics() {
    const userClimbs = climbs.filter(c => c.username === currentUser);
    
    if (userClimbs.length === 0) {
        document.getElementById('analytics-tab').innerHTML = `
            <div class="no-data">
                <h3>No climb data yet!</h3>
                <p>Log some climbs to see your analytics</p>
            </div>
        `;
        return;
    }
    
    renderGradePyramid(userClimbs);
    renderStyleRadar(userClimbs);
    renderStyleHeatmap(userClimbs);
    renderProgressTimeline(userClimbs);
}

function renderGradePyramid(userClimbs) {
    const grades = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12'];
    const sends = grades.map(g => 
        userClimbs.filter(c => c.grade === g && !c.isProject).length
    );
    
    new Chart(document.getElementById('gradeChart'), {
        type: 'bar',
        data: {
            labels: grades,
            datasets: [{
                label: 'Sends',
                data: sends,
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderStyleRadar(userClimbs) {
    const styles = ['Crimp', 'Sloper', 'Overhang', 'Slab', 'Dyno', 'Pocket', 'Pinch', 'Compression'];
    const styleCounts = {};
    
    styles.forEach(style => {
        styleCounts[style] = userClimbs.filter(c => c.styles.includes(style)).length;
    });
    
    new Chart(document.getElementById('styleRadar'), {
        type: 'radar',
        data: {
            labels: styles,
            datasets: [{
                label: 'Style Frequency',
                data: Object.values(styleCounts),
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: '#3498db',
                pointBackgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: { beginAtZero: true }
            }
        }
    });
}

function renderStyleHeatmap(userClimbs) {
    const styles = ['Crimp', 'Sloper', 'Overhang', 'Slab'];
    const heatmap = document.getElementById('styleHeatmap');
    heatmap.innerHTML = '';
    
    // Calculate success rate per style
    const styleStats = styles.map(style => {
        const styleClimbs = userClimbs.filter(c => c.styles.includes(style));
        const sends = styleClimbs.filter(c => !c.isProject);
        const successRate = styleClimbs.length > 0 
            ? Math.round((sends.length / styleClimbs.length) * 100)
            : 0;
            
        return { style, rate: successRate };
    });
    
    // Sort by weakest to strongest
    styleStats.sort((a, b) => a.rate - b.rate);
    
    // Generate heatmap items
    styleStats.forEach(stat => {
        const hue = 120 * (stat.rate / 100); // Green scale
        const color = `hsl(${hue}, 70%, 50%)`;
        
        heatmap.innerHTML += `
            <div class="heatmap-item" style="border-top: 5px solid ${color}">
                <h4>${stat.style}</h4>
                <div class="heatmap-value">${stat.rate}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stat.rate}%; background: ${color}"></div>
                </div>
                <small>${getFeedbackForRate(stat.rate)}</small>
            </div>
        `;
    });
}

function getFeedbackForRate(rate) {
    if (rate >= 80) return "Strength!";
    if (rate >= 60) return "Solid";
    if (rate >= 40) return "Developing";
    if (rate >= 20) return "Needs work";
    return "Focus area";
}

function renderProgressTimeline(userClimbs) {
    // Group by month
    const monthlyData = {};
    userClimbs.forEach(climb => {
        const date = new Date(climb.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                sends: 0,
                projects: 0,
                maxBoulder: 0,
                maxRoped: 0
            };
        }
        
        if (!climb.isProject) {
            monthlyData[monthYear].sends++;
            
            // Track max grades
            if (climb.climbType === 'boulder') {
                const gradeVal = parseInt(climb.grade.substring(1)) || 0;
                if (gradeVal > monthlyData[monthYear].maxBoulder) {
                    monthlyData[monthYear].maxBoulder = gradeVal;
                }
            } else {
                const gradeVal = parseFloat(climb.grade.substring(2)) || 0;
                if (gradeVal > monthlyData[monthYear].maxRoped) {
                    monthlyData[monthYear].maxRoped = gradeVal;
                }
            }
        } else {
            monthlyData[monthYear].projects++;
        }
    });
    
    // Prepare chart data
    const labels = Object.keys(monthlyData).sort();
    const sendData = labels.map(m => monthlyData[m].sends);
    const projectData = labels.map(m => monthlyData[m].projects);
    const boulderData = labels.map(m => monthlyData[m].maxBoulder);
    const ropedData = labels.map(m => monthlyData[m].maxRoped);
    
    new Chart(document.getElementById('progressChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sends',
                    data: sendData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Projects',
                    data: projectData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Max Boulder (V-scale)',
                    data: boulderData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    yAxisID: 'y1',
                    borderDash: [5, 5]
                },
                {
                    label: 'Max Roped (5.x)',
                    data: ropedData,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left'
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0
                }
            }
        }
    });
}

// ======================
// UI HELPERS
// ======================

function showUploadPopup() {
    document.getElementById('uploadPopup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('dateInput').valueAsDate = new Date();
    updateGradeOptions('boulder'); // Default to bouldering
}

function hideUploadPopup() {
    document.getElementById('uploadPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// ======================
// INITIALIZATION
// ======================

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);