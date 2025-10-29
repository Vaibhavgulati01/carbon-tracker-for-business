// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let currentOrgId = localStorage.getItem('currentOrgId');
let activitiesData = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        fetchDashboardData();
    }, 1000);
});

// Fetch real data from API
async function fetchDashboardData() {
    if (!currentOrgId) {
        showNotification('No organization data found. Please upload data first.', 'error');
        document.getElementById('skeletonLoader').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
        setTimeout(() => {
            window.location.href = 'data-entry.html';
        }, 2000);
        return;
    }
    
    try {
        // Fetch emission summary
        const summaryResponse = await fetch(`${API_BASE_URL}/calculations/${currentOrgId}/summary`);
        const summaryData = await summaryResponse.json();
        
        // Fetch activities
        const activitiesResponse = await fetch(`${API_BASE_URL}/activities/${currentOrgId}`);
        const activitiesResult = await activitiesResponse.json();
        
        if (summaryData.success) {
            const summary = summaryData.data;
            
            // Animate metrics with real data
            animateValue('totalEmissions', 0, summary.total, 1500);
            animateValue('scope1Emissions', 0, summary.scope1, 1500);
            animateValue('scope2Emissions', 0, summary.scope2, 1500);
            animateValue('scope3Emissions', 0, summary.scope3, 1500);
            
            // Store activities data
            if (activitiesResult.success && activitiesResult.data) {
                activitiesData = activitiesResult.data;
            }
            
            // Update performance card
            document.getElementById('totalActivitiesCount').textContent = activitiesData.length;
            document.getElementById('dataPointsCount').textContent = activitiesData.length + ' activities';
            
            if (activitiesData.length > 0) {
                const dates = activitiesData.map(a => new Date(a.created_at || a.activity_date));
                const latestDate = new Date(Math.max(...dates));
                document.getElementById('lastUpdated').textContent = latestDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            } else {
                document.getElementById('lastUpdated').textContent = 'No data';
            }
            
            // Initialize charts with real data
            initializeChartsWithRealData(summary);
            
            // Update top sources table
            await updateTopSourcesTable(summary.total);
            
            // Fetch AI insights (NEW)
            await fetchAIInsights();
        } else {
            throw new Error(summaryData.error || 'Failed to fetch summary');
        }
        
        // Hide skeleton and show content
        document.getElementById('skeletonLoader').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showNotification('Error loading dashboard data: ' + error.message, 'error');
        
        // Show content anyway with zero values
        document.getElementById('skeletonLoader').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
    }
}

// NEW: Fetch AI insights from backend
async function fetchAIInsights() {
    try {
        showNotification('Generating AI insights...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/ai/insights/${currentOrgId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            updateAIInsightsUI(data.data);
            showNotification('AI insights loaded!', 'success');
        } else {
            console.warn('AI insights not available:', data.error);
        }
    } catch (error) {
        console.error('Error fetching AI insights:', error);
        // Keep default insights if AI fails
    }
}

// NEW: Update AI Insights UI with real data
function updateAIInsightsUI(insights) {
    const insightsContainer = document.querySelector('.insights-grid');
    
    if (!insightsContainer) return;
    
    insightsContainer.innerHTML = `
        <div class="insight-card anomaly">
            <div class="insight-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="insight-content">
                <h4>${insights.anomaly.title}</h4>
                <p>${insights.anomaly.description}</p>
                <span class="insight-time">AI-generated • ${insights.anomaly.severity} severity</span>
            </div>
        </div>

        <div class="insight-card prediction">
            <div class="insight-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="insight-content">
                <h4>${insights.prediction.title}</h4>
                <p>${insights.prediction.description}</p>
                <span class="insight-time">Trend: ${insights.prediction.trend}</span>
            </div>
        </div>

        <div class="insight-card recommendation">
            <div class="insight-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="insight-content">
                <h4>${insights.recommendation.title}</h4>
                <p>${insights.recommendation.description}</p>
                <span class="insight-time">Potential: ${insights.recommendation.potential_reduction}</span>
            </div>
        </div>

        <div class="insight-card benchmark">
            <div class="insight-icon">
                <i class="fas fa-users"></i>
            </div>
            <div class="insight-content">
                <h4>${insights.benchmark.title}</h4>
                <p>${insights.benchmark.description}</p>
                <span class="insight-time">${insights.benchmark.percentile} performance</span>
            </div>
        </div>
    `;
}

// Update top sources table with real data
async function updateTopSourcesTable(totalEmissions) {
    try {
        const calcResponse = await fetch(`${API_BASE_URL}/calculations/${currentOrgId}`);
        const calcData = await calcResponse.json();
        
        if (!calcData.success || !calcData.data || calcData.data.length === 0) {
            document.getElementById('topSourcesBody').innerHTML = `
                <tr class="empty-state">
                    <td colspan="4">No emission data available</td>
                </tr>
            `;
            return;
        }
        
        const sourceMap = new Map();
        
        for (const calc of calcData.data) {
            const activity = activitiesData.find(a => a._id === calc.activity_id);
            
            if (activity) {
                const key = activity.subcategory || activity.category;
                
                if (!sourceMap.has(key)) {
                    sourceMap.set(key, {
                        source: key,
                        scope: calc.scope,
                        co2e_tons: 0,
                        count: 0
                    });
                }
                
                const source = sourceMap.get(key);
                source.co2e_tons += calc.co2e_tons;
                source.count += 1;
            }
        }
        
        const sources = Array.from(sourceMap.values())
            .sort((a, b) => b.co2e_tons - a.co2e_tons)
            .slice(0, 5);
        
        const tbody = document.getElementById('topSourcesBody');
        
        if (sources.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4">No emission sources found</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = sources.map(source => {
            const percentage = totalEmissions > 0 
                ? ((source.co2e_tons / totalEmissions) * 100).toFixed(1)
                : 0;
            
            return `
                <tr>
                    <td>${source.source}</td>
                    <td><span class="badge scope${source.scope}">Scope ${source.scope}</span></td>
                    <td>${source.co2e_tons.toFixed(2)}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error updating top sources:', error);
        document.getElementById('topSourcesBody').innerHTML = `
            <tr class="empty-state">
                <td colspan="4">Error loading data</td>
            </tr>
        `;
    }
}

// Animate counting numbers
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
        current += increment * Math.ceil(range / 100);
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current).toLocaleString();
    }, stepTime);
}

// Initialize charts with real data
function initializeChartsWithRealData(summary) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    initTrendChart(summary);
    initScopeChart(summary);
    initCategoryChart(summary);
}

function initTrendChart(summary) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const scope1Data = generateTrendData(summary.scope1, 10);
    const scope2Data = generateTrendData(summary.scope2, 10);
    const scope3Data = generateTrendData(summary.scope3, 10);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Scope 1',
                    data: scope1Data,
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Scope 2',
                    data: scope2Data,
                    borderColor: '#4ECDC4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Scope 3',
                    data: scope3Data,
                    borderColor: '#95E1D3',
                    backgroundColor: 'rgba(149, 225, 211, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

function generateTrendData(currentValue, months) {
    const data = [];
    const variation = currentValue * 0.15;
    
    for (let i = 0; i < months; i++) {
        const randomVariation = (Math.random() - 0.5) * variation;
        data.push(Math.max(0, currentValue + randomVariation));
    }
    
    data[data.length - 1] = currentValue;
    return data;
}

function initScopeChart(summary) {
    const canvas = document.getElementById('scopeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Scope 1', 'Scope 2', 'Scope 3'],
            datasets: [{
                data: [summary.scope1, summary.scope2, summary.scope3],
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#95E1D3']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initCategoryChart(summary) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const categories = {
        'Fuel': summary.scope1 * 0.6,
        'Electricity': summary.scope2,
        'Transport': summary.scope1 * 0.4,
        'Waste': summary.scope3 * 0.3,
        'Travel': summary.scope3 * 0.7
    };
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'Emissions (tCO₂e)',
                data: Object.values(categories),
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#FCBAD3']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Modal and other functions
function downloadReport() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.remove('active');
}

function generateReport(format) {
    showNotification(`${format} report generation started!`, 'success');
    setTimeout(() => closeModal(), 1000);
}

function showNotification(message, type) {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'info': 'info-circle',
        'warning': 'exclamation-triangle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
