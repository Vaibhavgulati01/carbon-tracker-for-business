const fs = require('fs');

/**
 * Carbon Tracker Data Seeder
 * Run this script to populate your dashboard with realistic data.
 * Requirements: Node 18+ (uses built-in fetch)
 * Make sure your backend server is running locally on port 8080.
 */

const API_URL = 'http://carbon-tracker-backend-env.eba-2cpxvmkq.ap-south-1.elasticbeanstalk.com/api';

// Realistic numbers for a 100-employee company over 12 months
const MONTHS_TO_SEED = 12;

async function seedData() {
    console.log("🌱 Starting Data Seeding Process...");
    console.log("Ensure backend is running at: " + API_URL);

    // 1. Register a Demo User
    const email = `admin_${Date.now()}@techcorp.com`;
    console.log(`\n1. Registering new test user: ${email}`);
    
    let token = null;
    try {
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Admin User",
                email: email,
                password: "password123"
            })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error);
        token = regData.token;
        console.log("✅ User registered successfully.");
    } catch (err) {
        console.error("❌ Registration failed:", err.message);
        return;
    }

    // 2. Create Organization
    console.log("\n2. Creating Organization: TechCorp (100 Employees)");
    try {
        const orgRes = await fetch(`${API_URL}/organizations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "TechCorp Inc.",
                industry: "Technology",
                employeeCount: 100,
                reportingYear: new Date().getFullYear(),
                operationalBoundary: "single-site"
            })
        });
        const orgData = await orgRes.json();
        if (!orgRes.ok) throw new Error(orgData.error);
        token = orgData.token; // API returns a new token containing the orgId
        console.log("✅ Organization created successfully.");
    } catch (err) {
        console.error("❌ Org creation failed:", err.message);
        return;
    }

    // 3. Generate and Insert Activities
    console.log("\n3. Generating 12 months of realistic activity data...");
    
    const activities = [];
    const now = new Date();
    
    for (let i = MONTHS_TO_SEED - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 15).toISOString().split('T')[0];
        const monthName = new Date(now.getFullYear(), now.getMonth() - i, 15).toLocaleString('default', { month: 'long' });

        // Base values with some slight monthly randomness (+/- 10%)
        const randomFactor = () => 0.9 + (Math.random() * 0.2); 

        // Electricity (Scope 2) - ~15,000 kWh per month
        activities.push({
            category: "Electricity",
            subcategory: "electricity_india",
            quantity: Math.floor(15000 * randomFactor()),
            date: date,
            description: `Monthly office electricity bill - ${monthName}`
        });

        // Fuel for backup generators (Scope 1) - ~200 Liters
        activities.push({
            category: "Fuel Combustion",
            subcategory: "diesel",
            quantity: Math.floor(200 * randomFactor()),
            date: date,
            description: `Diesel for backup generator - ${monthName}`
        });

        // Employee Commute Car (Scope 3) - ~30,000 km (Assume 60 people drive 20km/day)
        activities.push({
            category: "Employee Commute",
            subcategory: "employee_commute_car",
            quantity: Math.floor(30000 * randomFactor()),
            date: date,
            description: `Estimated employee commute (Car) - ${monthName}`
        });

        // Employee Commute Public (Scope 3) - ~15,000 km (Assume 40 people use metro 15km/day)
        activities.push({
            category: "Employee Commute",
            subcategory: "employee_commute_public",
            quantity: Math.floor(15000 * randomFactor()),
            date: date,
            description: `Estimated employee commute (Public Transit) - ${monthName}`
        });

        // Business Travel (Scope 3) - ~5 short haul flights per month
        activities.push({
            category: "Business Travel",
            subcategory: "business_travel_flight_short",
            quantity: Math.floor(5000 * randomFactor()), // 5000 km total typical
            date: date,
            description: `Sales team regional flights - ${monthName}`
        });

        // Waste (Scope 3) - ~800 kg per month
        activities.push({
            category: "Waste",
            subcategory: "waste_landfill",
            quantity: Math.floor(800 * randomFactor()),
            date: date,
            description: `General office waste to landfill - ${monthName}`
        });

        // Paper (Scope 3) - ~40 kg per month
        activities.push({
            category: "Other",
            subcategory: "paper",
            quantity: Math.floor(40 * randomFactor()),
            date: date,
            description: `Office printing paper usage - ${monthName}`
        });
    }

    let successCount = 0;
    
    // Insert them one by one
    for (let i = 0; i < activities.length; i++) {
        // Simple progress bar
        process.stdout.write(`\rUploading activity ${i + 1}/${activities.length}...`);
        
        try {
            const actRes = await fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(activities[i])
            });
            if (actRes.ok) successCount++;
        } catch (err) {
            // Ignore individual fails
        }
    }

    console.log(`\n\n🎉 Done! Successfully imported ${successCount} activities.`);
    console.log("\n================================================");
    console.log(`LOGIN DETAILS FOR YOUR PRESENTATION:`);
    console.log(`Email:    ${email}`);
    console.log(`Password: password123`);
    console.log("================================================\n");
    console.log("You can now open the frontend and log in with these credentials to see the populated dashboard!");
}

seedData();
