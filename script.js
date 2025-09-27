// App state
let appState = {
    currentView: 'menu',
    currentCategory: 0,
    sessionData: null,
    preparationData: {},
    categories: [
        {
            name: 'Job Satisfaction',
            description: 'How satisfied are you with your current role and responsibilities?'
        },
        {
            name: 'Recognition',
            description: 'How well do you feel your contributions are recognized and appreciated?'
        },
        {
            name: 'Empowerment',
            description: 'How empowered do you feel to make decisions and take initiative?'
        },
        {
            name: 'Personal Development',
            description: 'How satisfied are you with opportunities for learning and growth?'
        },
        {
            name: 'Motivation',
            description: 'How motivated do you feel in your current position?'
        },
        {
            name: 'Work/Life Balance',
            description: 'How well are you able to balance work demands with personal life?'
        }
    ]
};

// Supabase Configuration
// You'll need to replace these with your actual Supabase project details
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key

// Initialize Supabase client
let supabase;

// Initialize Supabase when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
    } else {
        console.warn('Supabase not configured. Please update SUPABASE_URL and SUPABASE_ANON_KEY');
    }
});

// Supabase API functions
async function savePreparationToSupabase(prepKey, userType, name, partner, ratings, comments) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('preparations')
        .upsert({
            prep_key: `${userType}_${prepKey}`,
            user_type: userType,
            name: name,
            partner: partner,
            ratings: ratings,
            comments: comments,
            updated_at: new Date().toISOString()
        });
    
    if (error) throw error;
    return { success: true, data };
}

async function getPreparationFromSupabase(prepKey) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('preparations')
        .select('*')
        .or(`prep_key.like.%${prepKey}%`);
    
    if (error) throw error;
    
    // Group by user type
    const prepData = {};
    data.forEach(row => {
        prepData[row.user_type] = {
            name: row.name,
            partner: row.partner,
            ratings: row.ratings,
            comments: row.comments,
            date: row.updated_at
        };
    });
    
    return { success: true, data: prepData };
}

async function saveSessionToSupabase(sessionData) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('sessions')
        .insert({
            manager_name: sessionData.managerName,
            employee_name: sessionData.employeeName,
            session_date: sessionData.sessionDate,
            employee_data: sessionData.employeeData,
            manager_data: sessionData.managerData,
            categories: sessionData.categories
        });
    
    if (error) throw error;
    return { success: true, data };
}

async function getAllSessionsFromSupabase() {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('session_date', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
}

// Fallback to localStorage for offline functionality
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

async function getAllSessions() {
    try {
        const response = await getAllSessionsFromSupabase();
        return response.data || [];
    } catch (error) {
        console.warn('Supabase unavailable, using local storage:', error);
        return getFromLocalStorage('catchupSessions') || [];
    }
}

// Navigation functions
function showEmployeeForm() {
    hideAllSections();
    document.getElementById('preparationSection').style.display = 'block';
    document.getElementById('prepTitle').textContent = 'Employee Preparation';
    setupPreparationForm('employee');
}

function showManagerForm() {
    hideAllSections();
    document.getElementById('preparationSection').style.display = 'block';
    document.getElementById('prepTitle').textContent = 'Manager Preparation';
    setupPreparationForm('manager');
}

function showSessionSetup() {
    hideAllSections();
    document.getElementById('sessionSetup').style.display = 'block';
}

function backToMenu() {
    hideAllSections();
    document.getElementById('mainMenu').style.display = 'block';
}

function hideAllSections() {
    const sections = ['mainMenu', 'preparationSection', 'sessionSetup', 'sessionSection', 'resultsSection', 'historySection'];
    sections.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

// Preparation form setup
function setupPreparationForm(userType) {
    const form = document.getElementById('preparationForm');
    let html = '';
    
    appState.categories.forEach((category, index) => {
        html += `
            <div class="category-prep">
                <h4>${category.name}</h4>
                <p>${category.description}</p>
                
                <div class="prep-rating">
                    <label>Your Rating:</label>
                    <div class="rating-scale-labels">
                        <span>Very Dissatisfied</span>
                        <span>Very Satisfied</span>
                    </div>
                    <div class="prep-rating-buttons" data-category="${index}">
                        <button type="button" class="prep-rating-btn" data-rating="1" onclick="selectPrepRating(${index}, 1)">😞</button>
                        <button type="button" class="prep-rating-btn" data-rating="2" onclick="selectPrepRating(${index}, 2)">😕</button>
                        <button type="button" class="prep-rating-btn" data-rating="3" onclick="selectPrepRating(${index}, 3)">😐</button>
                        <button type="button" class="prep-rating-btn" data-rating="4" onclick="selectPrepRating(${index}, 4)">😊</button>
                        <button type="button" class="prep-rating-btn" data-rating="5" onclick="selectPrepRating(${index}, 5)">😍</button>
                    </div>
                </div>
                
                <div class="prep-comment">
                    <label>Your Comments:</label>
                    <textarea id="comment_${index}" placeholder="Share your thoughts on this category..."></textarea>
                </div>
            </div>
        `;
    });
    
    form.innerHTML = html;
    
    // Load existing data if available
    loadPreparationData(userType);
}

function selectPrepRating(categoryIndex, rating) {
    const buttons = document.querySelectorAll(`[data-category="${categoryIndex}"] .prep-rating-btn`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-category="${categoryIndex}"] [data-rating="${rating}"]`).classList.add('selected');
}

async function savePreparation() {
    const name = document.getElementById('prepName').value.trim();
    const partner = document.getElementById('prepPartner').value.trim();
    const userType = document.getElementById('prepTitle').textContent.includes('Employee') ? 'employee' : 'manager';
    
    if (!name || !partner) {
        alert('Please enter both names.');
        return;
    }
    
    // Save ratings and comments
    const ratings = {};
    const comments = {};
    
    appState.categories.forEach((category, index) => {
        const selectedRating = document.querySelector(`[data-category="${index}"] .prep-rating-btn.selected`);
        const comment = document.getElementById(`comment_${index}`).value.trim();
        
        if (selectedRating) {
            ratings[category.name] = parseInt(selectedRating.dataset.rating);
        }
        comments[category.name] = comment;
    });
    
    try {
        // Try to save to Supabase first
        const preparationKey = `${name}_${partner}`;
        await savePreparationToSupabase(preparationKey, userType, name, partner, ratings, comments);
        
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} preparation saved successfully!`);
    } catch (error) {
        console.warn('Supabase save failed, using local storage:', error);
        
        // Fallback to localStorage
        const preparationKey = `${name}_${partner}`;
        let existingData = getFromLocalStorage(`prep_${preparationKey}`) || {};
        
        existingData[userType] = {
            name: name,
            partner: partner,
            ratings: ratings,
            comments: comments,
            date: new Date().toISOString()
        };
        
        saveToLocalStorage(`prep_${preparationKey}`, existingData);
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} preparation saved locally!`);
    }
    
    backToMenu();
}

function loadPreparationData(userType) {
    // This would load existing data if the user has previously filled out the form
    // For now, we'll leave it empty as it's a new session each time
}

// Session functions
async function startSession() {
    const managerName = document.getElementById('sessionManager').value.trim();
    const employeeName = document.getElementById('sessionEmployee').value.trim();
    
    if (!managerName || !employeeName) {
        alert('Please enter both manager and employee names.');
        return;
    }
    
    try {
        // Try to load from Supabase first
        const prepKey1 = `${employeeName}_${managerName}`;
        const prepKey2 = `${managerName}_${employeeName}`;
        
        let prepData;
        try {
            const response1 = await getPreparationFromSupabase(prepKey1);
            prepData = response1.data;
        } catch (error) {
            const response2 = await getPreparationFromSupabase(prepKey2);
            prepData = response2.data;
        }
        
        if (!prepData || !prepData.employee || !prepData.manager) {
            throw new Error('Incomplete preparation data');
        }
        
        appState.sessionData = {
            managerName: managerName,
            employeeName: employeeName,
            employee: prepData.employee,
            manager: prepData.manager,
            sessionDate: new Date().toISOString()
        };
        
    } catch (error) {
        console.warn('Supabase load failed, trying local storage:', error);
        
        // Fallback to localStorage
        const prepKey1 = `${employeeName}_${managerName}`;
        const prepKey2 = `${managerName}_${employeeName}`;
        
        let prepData = getFromLocalStorage(`prep_${prepKey1}`) || getFromLocalStorage(`prep_${prepKey2}`);
        
        if (!prepData || !prepData.employee || !prepData.manager) {
            alert('Both employee and manager must complete their preparation forms before starting the session.');
            return;
        }
        
        appState.sessionData = {
            managerName: managerName,
            employeeName: employeeName,
            employee: prepData.employee,
            manager: prepData.manager,
            sessionDate: new Date().toISOString()
        };
    }
    
    appState.currentCategory = 0;
    
    hideAllSections();
    document.getElementById('sessionSection').style.display = 'block';
    
    updateSessionDisplay();
}

function updateSessionDisplay() {
    const category = appState.categories[appState.currentCategory];
    
    document.getElementById('sessionTitle').textContent = 
        `${appState.sessionData.managerName} & ${appState.sessionData.employeeName}`;
    document.getElementById('categoryProgress').textContent = appState.currentCategory + 1;
    document.getElementById('currentCategory').textContent = category.name;
    document.getElementById('categoryDescription').textContent = category.description;
    
    // Reset reveal states
    document.getElementById('startRevealBtn').style.display = 'block';
    document.getElementById('employeeReveal').style.display = 'none';
    document.getElementById('managerReveal').style.display = 'none';
}

function revealEmployee() {
    const category = appState.categories[appState.currentCategory];
    const employeeData = appState.sessionData.employee;
    
    const rating = employeeData.ratings[category.name];
    const comment = employeeData.comments[category.name];
    
    // Convert rating to emoji
    const ratingEmojis = ['', '😞', '😕', '😐', '😊', '😍'];
    document.getElementById('employeeRatingValue').textContent = rating ? ratingEmojis[rating] : '❓';
    document.getElementById('employeeCommentDisplay').textContent = comment || 'No comment provided';
    
    document.getElementById('startRevealBtn').style.display = 'none';
    document.getElementById('employeeReveal').style.display = 'block';
}

function revealManager() {
    const category = appState.categories[appState.currentCategory];
    const managerData = appState.sessionData.manager;
    const employeeData = appState.sessionData.employee;
    
    const managerRating = managerData.ratings[category.name];
    const managerComment = managerData.comments[category.name];
    const employeeRating = employeeData.ratings[category.name];
    
    // Convert rating to emoji
    const ratingEmojis = ['', '😞', '😕', '😐', '😊', '😍'];
    document.getElementById('managerRatingValue').textContent = managerRating ? ratingEmojis[managerRating] : '❓';
    document.getElementById('managerCommentDisplay').textContent = managerComment || 'No comment provided';
    
    // Show comparison
    const difference = Math.abs((managerRating || 0) - (employeeRating || 0));
    const diffElement = document.getElementById('ratingDifference');
    
    if (difference === 0) {
        diffElement.textContent = 'Perfect alignment! Both rated this category the same.';
        diffElement.className = 'rating-difference perfect';
    } else if (difference <= 1) {
        diffElement.textContent = `Close alignment: ${difference} point difference`;
        diffElement.className = 'rating-difference small';
    } else {
        diffElement.textContent = `Significant difference: ${difference} points apart`;
        diffElement.className = 'rating-difference large';
    }
    
    document.getElementById('managerReveal').style.display = 'block';
}

function nextCategory() {
    appState.currentCategory++;
    
    if (appState.currentCategory >= appState.categories.length) {
        showResults();
        return;
    }
    
    updateSessionDisplay();
}



function showResults() {
    hideAllSections();
    document.getElementById('resultsSection').style.display = 'block';
    
    const sessionData = appState.sessionData;
    
    // Create summary table
    let tableHTML = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>${sessionData.employeeName} Rating</th>
                    <th>${sessionData.managerName} Rating</th>
                    <th>Difference</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const ratingEmojis = ['', '😞', '😕', '😐', '😊', '😍'];
    
    appState.categories.forEach(category => {
        const employeeRating = sessionData.employee.ratings[category.name];
        const managerRating = sessionData.manager.ratings[category.name];
        const difference = (employeeRating && managerRating) ? 
            Math.abs(employeeRating - managerRating) : 'N/A';
        
        const employeeDisplay = employeeRating ? `${ratingEmojis[employeeRating]} ${employeeRating}` : 'N/A';
        const managerDisplay = managerRating ? `${ratingEmojis[managerRating]} ${managerRating}` : 'N/A';
        
        tableHTML += `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${employeeDisplay}</td>
                <td>${managerDisplay}</td>
                <td>${difference === 0 ? '🎯 Perfect Match!' : (difference === 'N/A' ? 'N/A' : `±${difference}`)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    
    // Calculate averages
    const employeeAvg = calculateSessionAverage(sessionData, 'employee');
    const managerAvg = calculateSessionAverage(sessionData, 'manager');
    
    tableHTML += `
        <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>Overall Averages</h3>
            <p><strong>${sessionData.employeeName}:</strong> ${employeeAvg.toFixed(1)}</p>
            <p><strong>${sessionData.managerName}:</strong> ${managerAvg.toFixed(1)}</p>
            <p><strong>Overall Alignment:</strong> ${Math.abs(employeeAvg - managerAvg).toFixed(1)} point difference</p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h4>Comments Summary</h4>
            <div id="commentsSummary"></div>
        </div>
    `;
    
    document.getElementById('summaryTable').innerHTML = tableHTML;
    
    // Add comments summary
    let commentsHTML = '';
    appState.categories.forEach(category => {
        const employeeComment = sessionData.employee.comments[category.name];
        const managerComment = sessionData.manager.comments[category.name];
        
        if (employeeComment || managerComment) {
            commentsHTML += `
                <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 6px;">
                    <strong>${category.name}:</strong><br>
                    ${employeeComment ? `<em>Employee:</em> ${employeeComment}<br>` : ''}
                    ${managerComment ? `<em>Manager:</em> ${managerComment}` : ''}
                </div>
            `;
        }
    });
    
    document.getElementById('commentsSummary').innerHTML = commentsHTML || '<p>No comments were provided.</p>';
}

function calculateSessionAverage(sessionData, userType) {
    let total = 0;
    let count = 0;
    
    appState.categories.forEach(category => {
        const rating = sessionData[userType].ratings[category.name];
        if (rating && rating !== 'N/A') {
            total += rating;
            count++;
        }
    });
    
    return count > 0 ? total / count : 0;
}

function resetSession() {
    // Reset app state
    appState.currentCategory = 0;
    appState.sessionData = null;
    
    // Clear form inputs
    document.getElementById('sessionManager').value = '';
    document.getElementById('sessionEmployee').value = '';
    document.getElementById('prepName').value = '';
    document.getElementById('prepPartner').value = '';
    
    // Show main menu
    backToMenu();
}

// PDF Export functionality
function exportToPDF() {
    if (!appState.sessionData) {
        alert('No session data available to export.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const sessionData = appState.sessionData;
    
    // Header
    doc.setFontSize(20);
    doc.text('One-to-One Catch-up Report', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Manager: ${sessionData.managerName}`, 20, 45);
    doc.text(`Employee: ${sessionData.employeeName}`, 20, 55);
    doc.text(`Date: ${new Date(sessionData.sessionDate).toLocaleDateString()}`, 20, 65);
    
    let yPosition = 85;
    
    // Ratings summary
    doc.setFontSize(16);
    doc.text('Ratings Summary', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    appState.categories.forEach(category => {
        const employeeRating = sessionData.employee.ratings[category.name] || 'N/A';
        const managerRating = sessionData.manager.ratings[category.name] || 'N/A';
        const difference = (employeeRating !== 'N/A' && managerRating !== 'N/A') ? 
            Math.abs(employeeRating - managerRating) : 'N/A';
        
        doc.text(`${category.name}:`, 20, yPosition);
        doc.text(`Employee: ${employeeRating}`, 80, yPosition);
        doc.text(`Manager: ${managerRating}`, 120, yPosition);
        doc.text(`Diff: ${difference}`, 160, yPosition);
        yPosition += 10;
    });
    
    // Averages
    yPosition += 10;
    const employeeAvg = calculateSessionAverage(sessionData, 'employee');
    const managerAvg = calculateSessionAverage(sessionData, 'manager');
    
    doc.setFontSize(12);
    doc.text(`Employee Average: ${employeeAvg.toFixed(1)}`, 20, yPosition);
    doc.text(`Manager Average: ${managerAvg.toFixed(1)}`, 120, yPosition);
    yPosition += 20;
    
    // Comments section
    doc.setFontSize(16);
    doc.text('Comments & Discussion', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    appState.categories.forEach(category => {
        const employeeComment = sessionData.employee.comments[category.name];
        const managerComment = sessionData.manager.comments[category.name];
        
        if (employeeComment || managerComment) {
            doc.setFontSize(12);
            doc.text(`${category.name}:`, 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(10);
            if (employeeComment) {
                const lines = doc.splitTextToSize(`Employee: ${employeeComment}`, 170);
                doc.text(lines, 25, yPosition);
                yPosition += lines.length * 5;
            }
            if (managerComment) {
                const lines = doc.splitTextToSize(`Manager: ${managerComment}`, 170);
                doc.text(lines, 25, yPosition);
                yPosition += lines.length * 5;
            }
            yPosition += 5;
        }
        
        // Check if we need a new page
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
    });
    
    // Save the PDF
    const fileName = `catchup_${sessionData.employeeName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Save session
async function saveSession() {
    if (!appState.sessionData) {
        alert('No session data available to save.');
        return;
    }
    
    const sessionData = appState.sessionData;
    
    const sessionToSave = {
        managerName: sessionData.managerName,
        employeeName: sessionData.employeeName,
        sessionDate: sessionData.sessionDate,
        employeeData: sessionData.employee,
        managerData: sessionData.manager,
        categories: appState.categories
    };
    
    try {
        // Try to save to Supabase first
        await saveSessionToSupabase(sessionToSave);
        alert('Session saved successfully!');
    } catch (error) {
        console.warn('Supabase save failed, using local storage:', error);
        
        // Fallback to localStorage
        const sessions = await getAllSessions();
        const newSession = {
            id: Date.now(),
            ...sessionToSave,
            date: sessionData.sessionDate,
            employee_data: sessionData.employee,
            manager_data: sessionData.manager
        };
        
        sessions.push(newSession);
        saveToLocalStorage('catchupSessions', sessions);
        
        alert('Session saved locally!');
    }
}

// Show history section
function showHistory() {
    const sessions = getAllSessions();
    
    if (sessions.length === 0) {
        alert('No historical sessions found.');
        return;
    }
    
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('historySection').style.display = 'block';
    
    // Populate filter dropdown
    const filter = document.getElementById('historyFilter');
    filter.innerHTML = '<option value="all">All Sessions</option>';
    
    const uniquePairs = [...new Set(sessions.map(s => `${s.managerName} & ${s.employeeName}`))];
    uniquePairs.forEach(pair => {
        const option = document.createElement('option');
        option.value = pair;
        option.textContent = pair;
        filter.appendChild(option);
    });
    
    displayHistoricalSessions(sessions);
    createComparisonChart(sessions);
    
    // Add filter event listener
    filter.onchange = () => {
        const filterValue = filter.value;
        const filteredSessions = filterValue === 'all' ? sessions : 
            sessions.filter(s => `${s.managerName} & ${s.employeeName}` === filterValue);
        displayHistoricalSessions(filteredSessions);
        createComparisonChart(filteredSessions);
    };
}

// Display historical sessions
function displayHistoricalSessions(sessions) {
    const historyContent = document.getElementById('historyContent');
    
    if (sessions.length === 0) {
        historyContent.innerHTML = '<p>No sessions match the selected filter.</p>';
        return;
    }
    
    let html = '';
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sessions.forEach(session => {
        html += `
            <div class="history-item">
                <h3>${session.managerName} & ${session.employeeName}</h3>
                <div class="date">${new Date(session.date).toLocaleDateString()}</div>
                
                <div class="history-ratings">
        `;
        
        session.categories.forEach(category => {
            const employeeRating = session.ratings[category.name].employee;
            const managerRating = session.ratings[category.name].manager;
            const employeeComment = session.comments[category.name].employee;
            const managerComment = session.comments[category.name].manager;
            
            html += `
                <div class="history-category">
                    <strong>${category.name}</strong>
                    <div class="rating-comparison">
                        <span class="employee-hist">Employee: ${employeeRating}</span>
                        <span class="manager-hist">Manager: ${managerRating}</span>
                    </div>
            `;
            
            if (employeeComment || managerComment) {
                html += '<div style="margin-top: 8px; font-size: 0.85em;">';
                if (employeeComment) {
                    html += `<div><em>Employee:</em> ${employeeComment}</div>`;
                }
                if (managerComment) {
                    html += `<div><em>Manager:</em> ${managerComment}</div>`;
                }
                html += '</div>';
            }
            
            html += '</div>';
        });
        
        html += `
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e5e9;">
                    <strong>Averages:</strong>
                    Employee: ${calculateSessionAverage(session, 'employee').toFixed(1)} | 
                    Manager: ${calculateSessionAverage(session, 'manager').toFixed(1)}
                </div>
            </div>
        `;
    });
    
    historyContent.innerHTML = html;
}

// Calculate average for a specific session
function calculateSessionAverage(session, userType) {
    let total = 0;
    let count = 0;
    
    session.categories.forEach(category => {
        total += session.ratings[category.name][userType];
        count++;
    });
    
    return total / count;
}

// Create comparison chart
function createComparisonChart(sessions) {
    const chartContainer = document.getElementById('comparisonChart');
    
    if (sessions.length < 2) {
        chartContainer.innerHTML = '<div class="comparison-chart"><h3>Trend Analysis</h3><p>Need at least 2 sessions to show trends.</p></div>';
        return;
    }
    
    // Sort sessions by date
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let html = `
        <div class="comparison-chart">
            <h3>Rating Trends Over Time</h3>
            <div style="margin-bottom: 20px;">
                <span style="color: #28a745;">● Employee</span>
                <span style="color: #007bff; margin-left: 20px;">● Manager</span>
            </div>
    `;
    
    // Create simple text-based trend display
    sessionData.categories.forEach(category => {
        html += `<div style="margin-bottom: 15px;">
            <strong>${category.name}</strong><br>
        `;
        
        sessions.forEach((session, index) => {
            const employeeRating = session.ratings[category.name].employee;
            const managerRating = session.ratings[category.name].manager;
            const date = new Date(session.date).toLocaleDateString();
            
            html += `
                <div style="display: inline-block; margin: 5px 10px; padding: 5px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-size: 0.8em;">${date}</div>
                    <div>
                        <span style="color: #28a745;">E: ${employeeRating}</span>
                        <span style="color: #007bff; margin-left: 10px;">M: ${managerRating}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    chartContainer.innerHTML = html;
}

// Close history and return to setup
function closeHistory() {
    document.getElementById('historySection').style.display = 'none';
    document.getElementById('setupSection').style.display = 'block';
}