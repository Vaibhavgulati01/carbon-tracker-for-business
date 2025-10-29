// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables
let currentStep = 1;
let activities = [];
let orgData = {};
let currentOrgId = null;

// Subcategory mapping (keep existing code)
const subcategories = {
    'Fuel Combustion': ['Diesel', 'Petrol/Gasoline', 'Natural Gas', 'LPG', 'Coal', 'Fuel Oil', 'Other'],
    'Electricity': ['Grid Electricity', 'Renewable Energy', 'Generator', 'Other'],
    'Transportation': ['Company Vehicles - Diesel', 'Company Vehicles - Petrol', 'Company Vehicles - Electric', 'Company Vehicles - Hybrid', 'Fleet - Trucks', 'Fleet - Vans', 'Other'],
    'Waste': ['Landfill', 'Recycling', 'Composting', 'Incineration', 'Hazardous Waste', 'Other'],
    'Water': ['Municipal Water Supply', 'Wastewater Treatment', 'Other'],
    'Business Travel': ['Air Travel - Domestic', 'Air Travel - International', 'Rail', 'Taxi/Ride Share', 'Rental Car', 'Hotel Stays', 'Other'],
    'Employee Commute': ['Car', 'Public Transport', 'Motorcycle', 'Bicycle', 'Walking', 'Other'],
    'Purchased Goods': ['Raw Materials', 'Office Supplies', 'Equipment', 'Packaging', 'Other']
};

const scopeMapping = {
    'Fuel Combustion': 1,
    'Transportation': 1,
    'Electricity': 2,
    'Waste': 3,
    'Water': 3,
    'Business Travel': 3,
    'Employee Commute': 3,
    'Purchased Goods': 3
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('activityDate').valueAsDate = new Date();
    document.getElementById('activityForm').addEventListener('submit', handleActivitySubmit);
});

// Update subcategories
function updateSubcategories() {
    const category = document.getElementById('category').value;
    const subcategorySelect = document.getElementById('subcategory');
    
    subcategorySelect.innerHTML = '<option value="">Select subcategory</option>';
    
    if (category && subcategories[category]) {
        subcategories[category].forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subcategorySelect.appendChild(option);
        });
    }
}

// Step navigation
function nextStep(step) {
    if (step === 1) {
        if (!validateOrgForm()) return;
        createOrganization();
    }
    
    document.getElementById(`step${step}`).classList.add('hidden');
    document.getElementById(`step${step + 1}`).classList.remove('hidden');
    
    updateProgressBar(step + 1);
    currentStep = step + 1;
    window.scrollTo(0, 0);
}

function previousStep(step) {
    document.getElementById(`step${step}`).classList.add('hidden');
    document.getElementById(`step${step - 1}`).classList.remove('hidden');
    
    updateProgressBar(step - 1);
    currentStep = step - 1;
    window.scrollTo(0, 0);
}

function updateProgressBar(step) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((stepElement, index) => {
        if (index < step) {
            stepElement.classList.add('active');
            stepElement.classList.add('completed');
        } else if (index === step - 1) {
            stepElement.classList.add('active');
            stepElement.classList.remove('completed');
        } else {
            stepElement.classList.remove('active');
            stepElement.classList.remove('completed');
        }
    });
}

// Form validations
function validateOrgForm() {
    const name = document.getElementById('orgName').value.trim();
    const sector = document.getElementById('sector').value;
    const size = document.getElementById('orgSize').value;
    const country = document.getElementById('country').value.trim();
    
    if (!name) {
        alert('Please enter organization name');
        document.getElementById('orgName').focus();
        return false;
    }
    if (!sector) {
        alert('Please select a sector');
        document.getElementById('sector').focus();
        return false;
    }
    if (!size) {
        alert('Please select organization size');
        document.getElementById('orgSize').focus();
        return false;
    }
    if (!country) {
        alert('Please enter country');
        document.getElementById('country').focus();
        return false;
    }
    return true;
}

// API Functions
async function createOrganization() {
    const name = document.getElementById('orgName').value.trim();
    const sector = document.getElementById('sector').value;
    const org_size = document.getElementById('orgSize').value;
    const country = document.getElementById('country').value.trim();
    
    orgData = { name, sector, org_size, country };
    
    try {
        showNotification('Creating organization...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/organizations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orgData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentOrgId = data.org_id;
            showNotification('Organization created successfully!', 'success');
            console.log('Organization ID:', currentOrgId);
        } else {
            throw new Error(data.error || 'Failed to create organization');
        }
    } catch (error) {
        console.error('Error creating organization:', error);
        showNotification('Error creating organization: ' + error.message, 'error');
    }
}

// Activity form handling
function handleActivitySubmit(e) {
    e.preventDefault();
    
    if (!currentOrgId) {
        showNotification('Please complete organization details first', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const category = formData.get('category');
    
    const activity = {
        activity_date: formData.get('activity_date'),
        category: category,
        subcategory: formData.get('subcategory'),
        unit: formData.get('unit'),
        quantity: parseFloat(formData.get('quantity')),
        meta_json: formData.get('meta_json'),
        scope: scopeMapping[category] || 3
    };
    
    activities.push(activity);
    updateActivitiesTable();
    updateSummaryStats();
    resetActivityForm();
    
    showNotification('Activity added successfully!', 'success');
}

function updateActivitiesTable() {
    const tbody = document.getElementById('activitiesBody');
    
    if (activities.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="8">No activities added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = activities.map((activity, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${formatDate(activity.activity_date)}</td>
            <td>${activity.category}</td>
            <td>${activity.subcategory}</td>
            <td>${activity.quantity.toLocaleString()}</td>
            <td>${activity.unit}</td>
            <td><span class="badge scope${activity.scope}">Scope ${activity.scope}</span></td>
            <td>
                <button onclick="removeActivity(${index})" class="icon-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateSummaryStats() {
    document.getElementById('totalActivities').textContent = activities.length;
    document.getElementById('scope1Count').textContent = activities.filter(a => a.scope === 1).length;
    document.getElementById('scope2Count').textContent = activities.filter(a => a.scope === 2).length;
    document.getElementById('scope3Count').textContent = activities.filter(a => a.scope === 3).length;
}

function removeActivity(index) {
    if (confirm('Are you sure you want to remove this activity?')) {
        activities.splice(index, 1);
        updateActivitiesTable();
        updateSummaryStats();
        showNotification('Activity removed', 'info');
    }
}

function resetActivityForm() {
    document.getElementById('activityForm').reset();
    document.getElementById('activityDate').valueAsDate = new Date();
    document.getElementById('subcategory').innerHTML = '<option value="">Select category first</option>';
}

// Submit all data
async function submitAllData() {
    if (!currentOrgId) {
        showNotification('Organization ID missing. Please start over.', 'error');
        return;
    }
    
    if (activities.length === 0) {
        showNotification('Please add at least one activity', 'error');
        return;
    }
    
    try {
        showNotification('Calculating emissions...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                org_id: currentOrgId,
                activities: activities
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification('Data submitted successfully!', 'success');
            
            // Store org_id in localStorage for dashboard
            localStorage.setItem('currentOrgId', currentOrgId);
            localStorage.setItem('orgData', JSON.stringify(orgData));
            localStorage.setItem('emissionSummary', JSON.stringify(data.summary));
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to submit data');
        }
    } catch (error) {
        console.error('Error submitting data:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showNotification(message, type) {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
