// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let currentOrgId = localStorage.getItem('currentOrgId');
let currentEmissions = { total: 0, scope1: 0, scope2: 0, scope3: 0 };
let comparisonChart = null;
let scopeImpactChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!currentOrgId) {
        showNotification('No organization data found. Please upload data first.', 'error');
        setTimeout(() => {
            window.location.href = 'data-entry.html';
        }, 2000);
        return;
    }
    
    loadCurrentEmissions();
    
    const input = document.getElementById('queryInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendQuery();
            }
        });
    }
});

// Load current emissions
async function loadCurrentEmissions() {
    try {
        const response = await fetch(`${API_BASE_URL}/calculations/${currentOrgId}/summary`);
        const data = await response.json();
        
        if (data.success) {
            currentEmissions = data.data;
            
            document.getElementById('currentTotal').textContent = currentEmissions.total.toFixed(1);
            document.getElementById('currentScope1').textContent = currentEmissions.scope1.toFixed(1);
            document.getElementById('currentScope2').textContent = currentEmissions.scope2.toFixed(1);
            document.getElementById('currentScope3').textContent = currentEmissions.scope3.toFixed(1);
        }
    } catch (error) {
        console.error('Error loading emissions:', error);
    }
}

// Send query to AI
async function sendQuery(queryText) {
    const input = document.getElementById('queryInput');
    const query = queryText || input.value.trim();
    
    if (!query) {
        showNotification('Please enter a question', 'warning');
        return;
    }
    
    const messagesContainer = document.getElementById('chatMessages');
    
    // Add user message
    addMessage('user', query);
    input.value = '';
    
    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    addMessage('assistant', '<i class="fas fa-spinner fa-spin"></i> Analyzing scenario with AI...', typingId);
    
    try {
        const response = await fetch(`${API_BASE_URL}/ai/scenario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                org_id: currentOrgId,
                query: query
            })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        document.getElementById(typingId)?.remove();
        
        if (data.success) {
            // Add AI response
            addMessage('assistant', formatAIResponse(data.data.analysis));
            
            // Parse and visualize impact
            parseAndVisualizeImpact(data.data.analysis, query);
        } else {
            throw new Error(data.error || 'Failed to get AI response');
        }
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById(typingId)?.remove();
        addMessage('assistant', '<strong>Error:</strong> Unable to analyze scenario. Please check your backend connection and try again.');
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add message to chat
function addMessage(type, content, id) {
    const messagesContainer = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    if (id) message.id = id;
    
    const avatar = type === 'user' 
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';
    
    message.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${content}</div>
    `;
    
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Parse AI response and extract numbers
function parseAndVisualizeImpact(response, query) {
    // Extract reduction percentage from response
    const reductionMatch = response.match(/(\d+(?:\.\d+)?)\s*%/);
    const reductionPercent = reductionMatch ? parseFloat(reductionMatch[1]) : 30;
    
    // Extract cost from response (handles various formats)
    const costMatch = response.match(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|M|thousand|K)?/i);
    let investment = 500000;
    if (costMatch) {
        investment = parseFloat(costMatch[1].replace(/,/g, ''));
        const costText = response.toLowerCase();
        if (costText.includes('million') || costText.includes(' m')) {
            investment *= 1000000;
        } else if (costText.includes('thousand') || costText.includes(' k')) {
            investment *= 1000;
        }
    }
    
    // Determine affected scope from query
    let affectedScope = 'all';
    const queryLower = query.toLowerCase();
    if (queryLower.includes('renewable') || queryLower.includes('solar') || queryLower.includes('electricity') || queryLower.includes('energy efficiency')) {
        affectedScope = 'scope2';
    } else if (queryLower.includes('vehicle') || queryLower.includes('fleet') || queryLower.includes('fuel') || queryLower.includes('diesel') || queryLower.includes('petrol')) {
        affectedScope = 'scope1';
    } else if (queryLower.includes('remote') || queryLower.includes('travel') || queryLower.includes('commut') || queryLower.includes('supply chain')) {
        affectedScope = 'scope3';
    }
    
    // Calculate projected emissions
    const projected = calculateProjectedEmissions(reductionPercent / 100, affectedScope);
    const reduction = currentEmissions.total - projected.total;
    
    // Update impact cards
    document.getElementById('reductionValue').textContent = reduction.toFixed(1) + ' tCO₂e';
    document.getElementById('reductionPercent').textContent = `-${reductionPercent.toFixed(1)}%`;
    
    // Format investment display
    let investmentDisplay = '';
    if (investment >= 1000000) {
        investmentDisplay = '$' + (investment / 1000000).toFixed(1) + 'M';
    } else if (investment >= 1000) {
        investmentDisplay = '$' + (investment / 1000).toFixed(0) + 'K';
    } else {
        investmentDisplay = '$' + investment.toFixed(0);
    }
    document.getElementById('investmentValue').textContent = investmentDisplay;
    
    // Calculate ROI
    const costPerTon = 50; // Average carbon credit price
    const annualSavings = reduction * costPerTon;
    const payback = annualSavings > 0 ? investment / annualSavings : 0;
    document.getElementById('roiValue').textContent = payback > 0 ? `Payback: ${payback.toFixed(1)} years` : 'ROI: High';
    
    // Show impact section
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('impactCards').style.display = 'block';
    
    // Create charts
    createComparisonChart(projected);
    createScopeImpactChart(projected);
}

// Calculate projected emissions
function calculateProjectedEmissions(reductionFactor, affectedScope) {
    const projected = {
        scope1: currentEmissions.scope1,
        scope2: currentEmissions.scope2,
        scope3: currentEmissions.scope3,
        total: 0
    };
    
    if (affectedScope === 'scope1') {
        projected.scope1 = currentEmissions.scope1 * (1 - reductionFactor);
    } else if (affectedScope === 'scope2') {
        projected.scope2 = currentEmissions.scope2 * (1 - reductionFactor);
    } else if (affectedScope === 'scope3') {
        projected.scope3 = currentEmissions.scope3 * (1 - reductionFactor);
    } else if (affectedScope === 'all') {
        projected.scope1 = currentEmissions.scope1 * (1 - reductionFactor);
        projected.scope2 = currentEmissions.scope2 * (1 - reductionFactor);
        projected.scope3 = currentEmissions.scope3 * (1 - reductionFactor);
    }
    
    projected.total = projected.scope1 + projected.scope2 + projected.scope3;
    
    return projected;
}

// Create before/after comparison line chart
function createComparisonChart(projected) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    if (comparisonChart) comparisonChart.destroy();
    
    const ctx = canvas.getContext('2d');
    
    // Calculate mid-point for implementation phase
    const scope1Mid = (currentEmissions.scope1 + projected.scope1) / 2;
    const scope2Mid = (currentEmissions.scope2 + projected.scope2) / 2;
    const scope3Mid = (currentEmissions.scope3 + projected.scope3) / 2;
    const totalMid = (currentEmissions.total + projected.total) / 2;
    
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Current', 'Implementation Phase', 'Projected'],
            datasets: [
                {
                    label: 'Scope 1',
                    data: [currentEmissions.scope1, scope1Mid, projected.scope1],
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#FF6B6B',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true
                },
                {
                    label: 'Scope 2',
                    data: [currentEmissions.scope2, scope2Mid, projected.scope2],
                    borderColor: '#4ECDC4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4ECDC4',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true
                },
                {
                    label: 'Scope 3',
                    data: [currentEmissions.scope3, scope3Mid, projected.scope3],
                    borderColor: '#95E1D3',
                    backgroundColor: 'rgba(149, 225, 211, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#95E1D3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true
                },
                {
                    label: 'Total',
                    data: [currentEmissions.total, totalMid, projected.total],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    tension: 0.4,
                    borderWidth: 4,
                    borderDash: [10, 5],
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter',
                            weight: '600'
                        }
                    }
                },
                title: {
                    display: true,
                    text: '📉 Emission Reduction Journey',
                    font: { 
                        size: 16, 
                        weight: 'bold',
                        family: 'Inter'
                    },
                    padding: { bottom: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(2) + ' tCO₂e';
                            
                            // Add percentage for last point
                            if (context.dataIndex === 2 && context.dataset.label !== 'Total') {
                                const current = context.dataset.data[0];
                                const projected = context.parsed.y;
                                if (current > 0) {
                                    const reduction = ((current - projected) / current * 100).toFixed(1);
                                    label += ` (${reduction}% reduction)`;
                                }
                            }
                            
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Emissions (tCO₂e)',
                        font: {
                            size: 13,
                            weight: '600',
                            family: 'Inter'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '600',
                            family: 'Inter'
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Create scope impact doughnut chart
function createScopeImpactChart(projected) {
    const canvas = document.getElementById('scopeImpactChart');
    if (!canvas) return;
    
    if (scopeImpactChart) scopeImpactChart.destroy();
    
    const ctx = canvas.getContext('2d');
    
    scopeImpactChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Scope 1', 'Scope 2', 'Scope 3'],
            datasets: [{
                data: [projected.scope1, projected.scope2, projected.scope3],
                backgroundColor: [
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(78, 205, 196, 0.8)',
                    'rgba(149, 225, 211, 0.8)'
                ],
                borderColor: [
                    '#FF6B6B',
                    '#4ECDC4',
                    '#95E1D3'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 12,
                        font: {
                            size: 11,
                            family: 'Inter',
                            weight: '600'
                        }
                    }
                },
                title: {
                    display: true,
                    text: '🎯 Projected Scope Distribution',
                    font: { 
                        size: 14, 
                        weight: 'bold',
                        family: 'Inter'
                    },
                    padding: { bottom: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return label + ': ' + value.toFixed(2) + ' tCO₂e (' + percentage + '%)';
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500
            }
        }
    });
}

// Format AI response with markdown-style formatting
function formatAIResponse(text) {
    // Split into paragraphs
    let formatted = text.split('\n\n').map(para => {
        para = para.trim();
        if (para.length > 0) {
            return `<p>${para}</p>`;
        }
        return '';
    }).join('');
    
    // Bold text between ** **
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Make numbered lists prettier
    formatted = formatted.replace(/(\d+\.)/g, '<br><strong>$1</strong>');
    
    // Bold important keywords
    const keywords = [
        'Impact:', 'Timeline:', 'Cost:', 'ROI:', 'Challenges:', 'Recommendation:', 
        'Scope 1:', 'Scope 2:', 'Scope 3:', 'Investment:', 'Payback:', 
        'Implementation:', 'Benefits:', 'Considerations:', 'Next Steps:'
    ];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        formatted = formatted.replace(regex, `<strong>${keyword}</strong>`);
    });
    
    return formatted;
}

// Quick scenario buttons
function sendQuickScenario(scenario) {
    const queries = {
        'renewable': 'What if we switch to 50% renewable energy? Calculate the specific impact on Scope 2 emissions, show exact investment needed in dollars, and provide detailed ROI analysis with payback period.',
        'ev': 'What if we replace 30% of our diesel vehicle fleet with electric vehicles? Show the exact impact on Scope 1 emissions in tCO2e, calculate the investment cost, and provide a detailed financial analysis with ROI.',
        'efficiency': 'What if we improve our overall energy efficiency by 20% through LED lighting upgrades and HVAC optimization? Calculate the emission reduction in tCO2e, investment costs, and show the payback period with ROI.',
        'remote': 'What if 40% of our employees work remotely permanently? Analyze the impact on Scope 3 emissions from reduced commuting and business travel. Provide specific emission reductions and cost savings.'
    };
    
    if (queries[scenario]) {
        document.getElementById('queryInput').value = queries[scenario];
        sendQuery(queries[scenario]);
    }
}

// Show notification
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
