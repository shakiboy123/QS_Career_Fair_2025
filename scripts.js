// Global state variables
let currentUser = null;
let companies = [];
let students = [];
let interviewRequests = [];
let refreshInterval = null;

// DOM elements - Authentication section
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const registerFormContainer = document.getElementById('register-form-container');
const loginFormContainer = document.getElementById('login-form-container');
const adminFormContainer = document.getElementById('admin-form-container');
const registerButton = document.getElementById('register-button');
const loginButton = document.getElementById('login-button');
const adminLoginButton = document.getElementById('admin-login-button');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const adminLoginLink = document.getElementById('admin-login-link');
const backToStudentLink = document.getElementById('back-to-student');
const registerAlert = document.getElementById('register-alert');
const loginAlert = document.getElementById('login-alert');
const adminAlert = document.getElementById('admin-alert');

// DOM elements - Main app section
const userNameDisplay = document.getElementById('user-name');
const userIndexDisplay = document.getElementById('user-index');
const requestsCountDisplay = document.getElementById('requests-count');
const logoutButton = document.getElementById('logout-button');
const companiesContainer = document.getElementById('companies-container');
const adminPanel = document.getElementById('admin-panel');
const appAlert = document.getElementById('app-alert');

// Modal elements
const companyModal = document.getElementById('company-modal');
const modalCompanyName = document.getElementById('modal-company-name');
const modalCompanyDescription = document.getElementById('modal-company-description');
const modalCompanySlots = document.getElementById('modal-company-slots');
const modalCompanyActions = document.getElementById('modal-company-actions');
const closeModalButton = document.querySelector('.close-button');

// Company form elements
const companyForm = document.getElementById('company-form');
const editCompanyId = document.getElementById('edit-company-id');
const companyName = document.getElementById('company-name');
const companyDescription = document.getElementById('company-description');
const companySlots = document.getElementById('company-slots');
const addCompanyButton = document.getElementById('add-company-button');
const updateCompanyButton = document.getElementById('update-company-button');
const cancelEditButton = document.getElementById('cancel-edit-button');

// Admin tabs
const tabCompanies = document.getElementById('tab-companies');
const tabStudents = document.getElementById('tab-students');
const tabRequests = document.getElementById('tab-requests');
const companiesTab = document.getElementById('companies-tab');
const studentsTab = document.getElementById('students-tab');
const requestsTab = document.getElementById('requests-tab');

// Containers
const adminCompaniesContainer = document.getElementById('admin-companies-container');
const registrationsContainer = document.getElementById('registrations-container');
const interviewRequestsContainer = document.getElementById('interview-requests-container');

// Events - Authentication
registerButton.addEventListener('click', handleRegistration);
loginButton.addEventListener('click', handleLogin);
adminLoginButton.addEventListener('click', handleAdminLogin);
showLoginLink.addEventListener('click', showLoginForm);
showRegisterLink.addEventListener('click', showRegisterForm);
adminLoginLink.addEventListener('click', showAdminLoginForm);
backToStudentLink.addEventListener('click', showLoginForm);
logoutButton.addEventListener('click', handleLogout);

// Events - Company management
addCompanyButton.addEventListener('click', handleAddCompany);
updateCompanyButton.addEventListener('click', handleUpdateCompany);
cancelEditButton.addEventListener('click', resetCompanyForm);

// Events - Modal
closeModalButton.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === companyModal) closeModal();
});

// Events - Admin tabs
tabCompanies.addEventListener('click', () => switchAdminTab('companies'));
tabStudents.addEventListener('click', () => switchAdminTab('students'));
tabRequests.addEventListener('click', () => switchAdminTab('requests'));

// Generate a unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize the application
function initApp() {
    // Load data from localStorage
    loadLocalData();
    
    // Generate a session ID if it doesn't exist
    if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', generateSessionId());
    }
    
    // Check if user is logged in for this session
    const sessionId = sessionStorage.getItem('sessionId');
    const storedUser = localStorage.getItem(`currentUser_${sessionId}`);
    
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (currentUser) {
                if (currentUser.isAdmin) {
                    showAdminPanel();
                } else {
                    showStudentView();
                }
                
                // Start auto-refresh
                startAutoRefresh();
            }
        } catch (error) {
            console.error("Error parsing stored user:", error);
            handleLogout();
        }
    }
    
    // Add beforeunload event to clean up on page close/refresh
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });
}

// Start auto-refresh
function startAutoRefresh() {
    // Clear any existing interval first
    stopAutoRefresh();
    
    // Set up a new refresh interval (every 5 seconds)
    refreshInterval = setInterval(() => {
        refreshData();
    }, 5000);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Refresh data and update the UI
function refreshData() {
    // Load fresh data from localStorage
    loadLocalData();
    
    // Update the UI based on current view
    if (currentUser) {
        if (currentUser.isAdmin) {
            // Update admin UI
            if (!adminPanel.classList.contains('hidden')) {
                // Only update the visible tab
                if (!companiesTab.classList.contains('hidden')) {
                    displayAdminCompanies();
                } else if (!studentsTab.classList.contains('hidden')) {
                    displayRegisteredStudents();
                } else if (!requestsTab.classList.contains('hidden')) {
                    displayInterviewRequests();
                }
            }
        } else {
            // Update student UI
            if (!appSection.classList.contains('hidden') && adminPanel.classList.contains('hidden')) {
                // Refresh student's remaining requests count
                const student = students.find(s => s.index === currentUser.index);
                if (student) {
                    currentUser.remainingRequests = student.remainingRequests;
                    requestsCountDisplay.textContent = currentUser.remainingRequests;
                    
                    // Update localStorage
                    const sessionId = sessionStorage.getItem('sessionId');
                    localStorage.setItem(`currentUser_${sessionId}`, JSON.stringify(currentUser));
                }
                
                // Refresh company list
                displayCompanies();
            }
        }
    }
}

// Load data from localStorage
function loadLocalData() {
    try {
        const storedCompanies = localStorage.getItem('companies');
        const storedStudents = localStorage.getItem('students');
        const storedRequests = localStorage.getItem('interviewRequests');
        
        companies = storedCompanies ? JSON.parse(storedCompanies) : [];
        students = storedStudents ? JSON.parse(storedStudents) : [];
        interviewRequests = storedRequests ? JSON.parse(storedRequests) : [];
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
        companies = [];
        students = [];
        interviewRequests = [];
    }
}

// Save data to localStorage
function saveLocalData() {
    localStorage.setItem('companies', JSON.stringify(companies));
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('interviewRequests', JSON.stringify(interviewRequests));
}

// Authentication functions
function handleRegistration() {
    const indexInput = document.getElementById('index').value.trim();
    const nameInput = document.getElementById('name').value.trim();
    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value;
    
    // Basic validation
    if (!indexInput || !nameInput || !emailInput || !passwordInput) {
        showAlert(registerAlert, 'All fields are required');
        return;
    }
    
    // Validate index number format
    const indexPattern = /^202[6-7][0-9]{2}[A-Z]$/;
    if (!indexPattern.test(indexInput)) {
        showAlert(registerAlert, 'Invalid index number format. Must be between 202601P-202742U');
        return;
    }
    
    // Check if index already exists
    if (students.some(student => student.index === indexInput)) {
        showAlert(registerAlert, 'This index number is already registered');
        return;
    }
    
    // Create new student
    const newStudent = {
        index: indexInput,
        name: nameInput,
        email: emailInput,
        password: passwordInput, // Note: In a real application, passwords should be hashed
        remainingRequests: 5,
        registrationDate: new Date().toISOString()
    };
    
    // Add to students array
    students.push(newStudent);
    
    // Save data
    saveLocalData();
    
    // Show success and redirect to login
    showAlert(registerAlert, 'Registration successful! You can now login.', 'success');
    setTimeout(() => {
        showLoginForm();
    }, 1500);
}

function handleLogin() {
    const indexInput = document.getElementById('login-index').value.trim();
    const passwordInput = document.getElementById('login-password').value;
    
    // Find student
    const student = students.find(s => s.index === indexInput && s.password === passwordInput);
    
    if (!student) {
        showAlert(loginAlert, 'Invalid index number or password');
        return;
    }
    
    // Set current user
    currentUser = {
        index: student.index,
        name: student.name,
        isAdmin: false,
        remainingRequests: student.remainingRequests
    };
    
    // Save to localStorage with session ID
    const sessionId = sessionStorage.getItem('sessionId');
    localStorage.setItem(`currentUser_${sessionId}`, JSON.stringify(currentUser));
    
    // Show student view
    showStudentView();
    
    // Start auto-refresh
    startAutoRefresh();
}

function handleAdminLogin() {
    const usernameInput = document.getElementById('admin-username').value.trim();
    const passwordInput = document.getElementById('admin-password').value;
    
    // Simple admin authentication (in a real app, use proper authentication)
    if (usernameInput === 'admin' && passwordInput === 'admin123') {
        currentUser = {
            name: 'Administrator',
            isAdmin: true
        };
        
        // Save to localStorage with session ID
        const sessionId = sessionStorage.getItem('sessionId');
        localStorage.setItem(`currentUser_${sessionId}`, JSON.stringify(currentUser));
        
        // Show admin panel
        showAdminPanel();
        
        // Start auto-refresh
        startAutoRefresh();
    } else {
        showAlert(adminAlert, 'Invalid admin credentials');
    }
}

function handleLogout() {
    // Stop auto-refresh
    stopAutoRefresh();
    
    // Clear current user for this session
    currentUser = null;
    const sessionId = sessionStorage.getItem('sessionId');
    localStorage.removeItem(`currentUser_${sessionId}`);
    
    // Show authentication section
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    adminPanel.classList.add('hidden');
    
    // Reset to login form
    showLoginForm();
}

// UI display functions
function showLoginForm() {
    registerFormContainer.classList.add('hidden');
    adminFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    clearAlerts();
}

function showRegisterForm() {
    loginFormContainer.classList.add('hidden');
    adminFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
    clearAlerts();
}

function showAdminLoginForm() {
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.add('hidden');
    adminFormContainer.classList.remove('hidden');
    clearAlerts();
}

function showStudentView() {
    // Hide auth section, show app section
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    
    // Update user info
    userNameDisplay.textContent = currentUser.name;
    userIndexDisplay.textContent = `(${currentUser.index})`;
    requestsCountDisplay.textContent = currentUser.remainingRequests;
    
    // Load companies
    displayCompanies();
}

function showAdminPanel() {
    // Hide auth section, show app section and admin panel
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    adminPanel.classList.remove('hidden');
    
    // Update user info
    userNameDisplay.textContent = currentUser.name;
    userIndexDisplay.textContent = '(Admin)';
    document.getElementById('requests-counter').classList.add('hidden');
    
    // Hide the companies section that students see
    companiesContainer.innerHTML = '';
    
    // Load admin data
    displayAdminCompanies();
    displayRegisteredStudents();
    displayInterviewRequests();
    
    // Default to companies tab
    switchAdminTab('companies');
}

function switchAdminTab(tabName) {
    // Hide all tabs
    [companiesTab, studentsTab, requestsTab].forEach(tab => tab.classList.add('hidden'));
    [tabCompanies, tabStudents, tabRequests].forEach(button => button.classList.remove('active'));
    
    // Show selected tab
    if (tabName === 'companies') {
        companiesTab.classList.remove('hidden');
        tabCompanies.classList.add('active');
        displayAdminCompanies();
    } else if (tabName === 'students') {
        studentsTab.classList.remove('hidden');
        tabStudents.classList.add('active');
        displayRegisteredStudents();
    } else if (tabName === 'requests') {
        requestsTab.classList.remove('hidden');
        tabRequests.classList.add('active');
        displayInterviewRequests();
    }
}

// Alert display
function showAlert(alertElement, message, type = 'danger') {
    alertElement.textContent = message;
    alertElement.classList.remove('alert-danger', 'alert-success');
    alertElement.classList.add(`alert-${type}`);
    alertElement.classList.remove('hidden');
    
    // Auto hide after a few seconds
    setTimeout(() => {
        alertElement.classList.add('hidden');
    }, 3000);
}

function clearAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.classList.add('hidden');
    });
}

// Company management
function handleAddCompany() {
    const name = companyName.value.trim();
    const description = companyDescription.value.trim();
    const slots = parseInt(companySlots.value);
    
    // Validation
    if (!name || isNaN(slots) || slots < 1) {
        showAlert(appAlert, 'Please fill in all required fields');
        return;
    }
    
    // Create new company
    const newCompany = {
        id: Date.now().toString(), // Simple unique ID
        name: name,
        description: description,
        availableSlots: slots,
        totalSlots: slots
    };
    
    // Add to companies array
    companies.push(newCompany);
    
    // Save data
    saveLocalData();
    
    // Reset form and update display
    resetCompanyForm();
    displayAdminCompanies();
    showAlert(appAlert, `Company "${name}" added successfully!`, 'success');
}

function handleUpdateCompany() {
    const id = editCompanyId.value;
    const name = companyName.value.trim();
    const description = companyDescription.value.trim();
    const slots = parseInt(companySlots.value);
    
    // Validation
    if (!id || !name || isNaN(slots) || slots < 1) {
        showAlert(appAlert, 'Please fill in all required fields');
        return;
    }
    
    // Find company
    const companyIndex = companies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
        showAlert(appAlert, 'Company not found');
        return;
    }
    
    // Update company
    companies[companyIndex].name = name;
    companies[companyIndex].description = description;
    
    // Handle slots update carefully to maintain consistency
    const currentAvailable = companies[companyIndex].availableSlots;
    const currentTotal = companies[companyIndex].totalSlots;
    const usedSlots = currentTotal - currentAvailable;
    
    // Ensure new slots value is not less than used slots
    if (slots < usedSlots) {
        showAlert(appAlert, `Cannot reduce slots below ${usedSlots} (slots already used)`);
        return;
    }
    
    companies[companyIndex].totalSlots = slots;
    companies[companyIndex].availableSlots = slots - usedSlots;
    
    // Save data
    saveLocalData();
    
    // Reset form and update display
    resetCompanyForm();
    displayAdminCompanies();
    showAlert(appAlert, `Company "${name}" updated successfully!`, 'success');
}

function editCompany(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    // Populate form
    editCompanyId.value = company.id;
    companyName.value = company.name;
    companyDescription.value = company.description;
    companySlots.value = company.totalSlots;
    
    // Show update buttons
    addCompanyButton.classList.add('hidden');
    updateCompanyButton.classList.remove('hidden');
    cancelEditButton.classList.remove('hidden');
}

function resetCompanyForm() {
    companyForm.reset();
    editCompanyId.value = '';
    
    // Show add button
    addCompanyButton.classList.remove('hidden');
    updateCompanyButton.classList.add('hidden');
    cancelEditButton.classList.add('hidden');
}

function deleteCompany(id) {
    // Check if company has interview requests
    const hasRequests = interviewRequests.some(req => req.companyId === id);
    if (hasRequests) {
        showAlert(appAlert, 'Cannot delete company with interview requests');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    // Remove company
    companies = companies.filter(c => c.id !== id);
    
    // Save data
    saveLocalData();
    
    // Update display
    displayAdminCompanies();
    showAlert(appAlert, 'Company deleted successfully!', 'success');
}

// Interview request management
function requestInterview(companyId) {
    // Prevent admin from making requests
    if (currentUser.isAdmin) {
        showAlert(appAlert, 'Administrators cannot make interview requests');
        closeModal();
        return;
    }
    
    // Find company
    const company = companies.find(c => c.id === companyId);
    if (!company) {
        showAlert(appAlert, 'Company not found');
        return;
    }
    
    // Check if company has available slots
    if (company.availableSlots <= 0) {
        showAlert(appAlert, 'No interview slots available for this company');
        return;
    }
    
    // Check if student has remaining requests
    if (currentUser.remainingRequests <= 0) {
        showAlert(appAlert, 'You have used all your interview requests');
        return;
    }
    
    // Check if student already requested this company
    const alreadyRequested = interviewRequests.some(
        req => req.studentIndex === currentUser.index && req.companyId === companyId
    );
    
    if (alreadyRequested) {
        showAlert(appAlert, 'You have already requested an interview with this company');
        return;
    }
    
    // Create new request
    const newRequest = {
        id: Date.now().toString(),
        companyId: companyId,
        companyName: company.name,
        studentIndex: currentUser.index,
        studentName: currentUser.name,
        requestDate: new Date().toISOString()
    };
    
    // Add request
    interviewRequests.push(newRequest);
    
    // Update company slots
    company.availableSlots--;
    
    // Update student remaining requests
    const studentIndex = students.findIndex(s => s.index === currentUser.index);
    if (studentIndex !== -1) {
        students[studentIndex].remainingRequests--;
        currentUser.remainingRequests--;
        requestsCountDisplay.textContent = currentUser.remainingRequests;
        
        // Update localStorage with session ID
        const sessionId = sessionStorage.getItem('sessionId');
        localStorage.setItem(`currentUser_${sessionId}`, JSON.stringify(currentUser));
    }
    
    // Save data
    saveLocalData();
    
    // Update UI
    displayCompanies();
    closeModal();
    showAlert(appAlert, `Interview request with ${company.name} submitted successfully!`, 'success');
}

// UI Display functions
function displayCompanies() {
    // If admin, don't show the student company view
    if (currentUser.isAdmin) {
        companiesContainer.innerHTML = '';
        return;
    }
    
    companiesContainer.innerHTML = '';
    
    if (companies.length === 0) {
        companiesContainer.innerHTML = '<p>No companies available at this time.</p>';
        return;
    }
    
    // Check if student has no remaining requests
    const noRemainingRequests = currentUser.remainingRequests <= 0;
    
    companies.forEach(company => {
        const alreadyRequested = interviewRequests.some(
            req => req.studentIndex === currentUser.index && req.companyId === company.id
        );
        
        const card = document.createElement('div');
        
        // Set appropriate class based on conditions
        let cardClass = 'company-card';
        
        if (company.availableSlots <= 0) {
            cardClass += ' no-slots';
        }
        
        if (alreadyRequested) {
            cardClass += ' already-requested';
        }
        
        if (noRemainingRequests && !alreadyRequested) {
            cardClass += ' no-requests-left';
        }
        
        card.className = cardClass;
        
        // Prepare status text
        let statusText = '';
        if (alreadyRequested) {
            statusText = '<p class="status-label">Already Requested</p>';
        } else if (company.availableSlots <= 0) {
            statusText = '<p class="status-label">No Slots Available</p>';
        }
        
        const slotsText = `${company.availableSlots} of ${company.totalSlots} slots available`;
        
        card.innerHTML = `
            <h3>${company.name}</h3>
            <p class="company-description">${company.description || 'No description available.'}</p>
            <p><strong>Available Slots:</strong> ${slotsText}</p>
            ${statusText}
            <button class="btn-secondary view-company" data-id="${company.id}">View Details</button>
        `;
        
        companiesContainer.appendChild(card);
        
        // Add event listener
        const viewButton = card.querySelector('.view-company');
        viewButton.addEventListener('click', () => openCompanyModal(company.id));
    });
}

function displayAdminCompanies() {
    adminCompaniesContainer.innerHTML = '';
    
    if (companies.length === 0) {
        adminCompaniesContainer.innerHTML = '<p>No companies available. Add a company using the form above.</p>';
        return;
    }
    
    companies.forEach(company => {
        const card = document.createElement('div');
        card.className = 'company-card';
        
        const slotsText = `${company.availableSlots} of ${company.totalSlots} slots available`;
        
        card.innerHTML = `
            <h3>${company.name}</h3>
            <p class="company-description">${company.description || 'No description available.'}</p>
            <p><strong>Available Slots:</strong> ${slotsText}</p>
            <div class="admin-controls">
                <button class="btn-edit edit-company" data-id="${company.id}">Edit</button>
                <button class="btn-danger delete-company" data-id="${company.id}">Delete</button>
            </div>
        `;
        
        adminCompaniesContainer.appendChild(card);
        
        // Add event listeners
        const editButton = card.querySelector('.edit-company');
        const deleteButton = card.querySelector('.delete-company');
        
        editButton.addEventListener('click', () => editCompany(company.id));
        deleteButton.addEventListener('click', () => deleteCompany(company.id));
    });
}

function displayRegisteredStudents() {
    if (students.length === 0) {
        registrationsContainer.innerHTML = '<p>No students registered yet.</p>';
        return;
    }
    
    // Sort students by registration date (newest first)
    const sortedStudents = [...students].sort((a, b) => 
        new Date(b.registrationDate) - new Date(a.registrationDate)
    );
    
    let tableHTML = `
        <table class="registration-table">
            <thead>
                <tr>
                    <th>Index</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Remaining Requests</th>
                    <th>Registration Date</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedStudents.forEach(student => {
        const date = new Date(student.registrationDate).toLocaleString();
        
        tableHTML += `
            <tr>
                <td>${student.index}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.remainingRequests}</td>
                <td>${date}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    registrationsContainer.innerHTML = tableHTML;
}

function displayInterviewRequests() {
    if (interviewRequests.length === 0) {
        interviewRequestsContainer.innerHTML = '<p class="no-requests">No interview requests submitted yet.</p>';
        return;
    }
    
    // Group requests by company
    const requestsByCompany = {};
    
    interviewRequests.forEach(request => {
        if (!requestsByCompany[request.companyId]) {
            requestsByCompany[request.companyId] = {
                companyId: request.companyId,
                companyName: request.companyName,
                requests: []
            };
        }
        
        requestsByCompany[request.companyId].requests.push(request);
    });
    
    // Sort companies alphabetically
    const sortedCompanies = Object.values(requestsByCompany).sort((a, b) => 
        a.companyName.localeCompare(b.companyName)
    );
    
    let html = '';
    
    sortedCompanies.forEach(company => {
        // Sort requests by date (newest first)
        const sortedRequests = [...company.requests].sort((a, b) => 
            new Date(b.requestDate) - new Date(a.requestDate)
        );
        
        html += `
            <div class="company-request-summary">
                <div class="company-request-header">
                    <h4>${company.companyName}</h4>
                    <span class="company-request-count">${sortedRequests.length} request(s)</span>
                </div>
                <div class="company-request-body">
                    <table class="requests-table">
                        <thead>
                            <tr>
                                <th>Student Index</th>
                                <th>Student Name</th>
                                <th>Request Date</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        sortedRequests.forEach(request => {
            const date = new Date(request.requestDate).toLocaleString();
            
            html += `
                <tr>
                    <td>${request.studentIndex}</td>
                    <td>${request.studentName}</td>
                    <td><span class="timestamp">${date}</span></td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    interviewRequestsContainer.innerHTML = html;
}

// Modal management
function openCompanyModal(companyId) {
    // Prevent admin from opening the student company modal
    if (currentUser.isAdmin) {
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    // Fill modal data
    modalCompanyName.textContent = company.name;
    modalCompanyDescription.textContent = company.description || 'No description available.';
    modalCompanySlots.textContent = `Available Slots: ${company.availableSlots} of ${company.totalSlots}`;
    
    // Check if user has already requested
    const alreadyRequested = interviewRequests.some(
        req => req.studentIndex === currentUser.index && req.companyId === companyId
    );
    
    // Add action button
    modalCompanyActions.innerHTML = '';
    
    if (alreadyRequested) {
        modalCompanyActions.innerHTML = '<p class="modal-status already-requested"><strong>You have already requested an interview with this company.</strong></p>';
    } else if (company.availableSlots <= 0) {
        modalCompanyActions.innerHTML = '<p class="modal-status no-slots"><strong>No interview slots available for this company.</strong></p>';
    } else if (currentUser.remainingRequests <= 0) {
        modalCompanyActions.innerHTML = '<p class="modal-status no-requests"><strong>You have used all your interview requests.</strong></p>';
    } else {
        const requestButton = document.createElement('button');
        requestButton.textContent = 'Request Interview';
        requestButton.className = 'btn-secondary';
        requestButton.addEventListener('click', () => requestInterview(companyId));
        modalCompanyActions.appendChild(requestButton);
    }
    
    // Show modal
    companyModal.style.display = 'flex';
}

function closeModal() {
    companyModal.style.display = 'none';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initApp);