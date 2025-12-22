// Emission factors by category (in kgCO2e per unit)
// Source: DEFRA 2024, IPCC Guidelines
const EMISSION_FACTORS = {
    // Scope 1 - Direct Emissions
    'diesel': { factor: 2.68, unit: 'liters', scope: 1, description: 'Diesel fuel combustion' },
    'petrol': { factor: 2.31, unit: 'liters', scope: 1, description: 'Petrol fuel combustion' },
    'natural_gas': { factor: 2.02, unit: 'm3', scope: 1, description: 'Natural gas combustion' },
    'lpg': { factor: 1.51, unit: 'liters', scope: 1, description: 'LPG combustion' },
    'company_vehicle_petrol': { factor: 0.17, unit: 'km', scope: 1, description: 'Company vehicle (petrol)' },
    'company_vehicle_diesel': { factor: 0.16, unit: 'km', scope: 1, description: 'Company vehicle (diesel)' },

    // Scope 2 - Indirect Energy Emissions
    'electricity_india': { factor: 0.82, unit: 'kWh', scope: 2, description: 'Grid electricity (India)' },
    'electricity_us': { factor: 0.42, unit: 'kWh', scope: 2, description: 'Grid electricity (US)' },
    'electricity_eu': { factor: 0.28, unit: 'kWh', scope: 2, description: 'Grid electricity (EU)' },
    'electricity_renewable': { factor: 0.02, unit: 'kWh', scope: 2, description: 'Renewable electricity' },

    // Scope 3 - Value Chain Emissions
    'business_travel_flight_short': { factor: 0.255, unit: 'km', scope: 3, description: 'Short-haul flights (<500km)' },
    'business_travel_flight_medium': { factor: 0.156, unit: 'km', scope: 3, description: 'Medium-haul flights (500-1500km)' },
    'business_travel_flight_long': { factor: 0.150, unit: 'km', scope: 3, description: 'Long-haul flights (>1500km)' },
    'business_travel_car': { factor: 0.17, unit: 'km', scope: 3, description: 'Business travel by car' },
    'business_travel_train': { factor: 0.04, unit: 'km', scope: 3, description: 'Business travel by train' },
    'employee_commute_car': { factor: 0.17, unit: 'km', scope: 3, description: 'Employee commute by car' },
    'employee_commute_public': { factor: 0.05, unit: 'km', scope: 3, description: 'Employee commute public transport' },
    'waste_landfill': { factor: 0.58, unit: 'kg', scope: 3, description: 'Waste to landfill' },
    'waste_recycled': { factor: 0.02, unit: 'kg', scope: 3, description: 'Recycled waste' },
    'water': { factor: 0.34, unit: 'm3', scope: 3, description: 'Water consumption' },
    'paper': { factor: 0.92, unit: 'kg', scope: 3, description: 'Paper consumption' },
    'shipping_road': { factor: 0.10, unit: 'tonne-km', scope: 3, description: 'Road freight' },
    'shipping_sea': { factor: 0.016, unit: 'tonne-km', scope: 3, description: 'Sea freight' },
    'shipping_air': { factor: 0.60, unit: 'tonne-km', scope: 3, description: 'Air freight' }
};

// Category mappings for easier selection
const CATEGORIES = {
    'Fuel Combustion': ['diesel', 'petrol', 'natural_gas', 'lpg'],
    'Company Vehicles': ['company_vehicle_petrol', 'company_vehicle_diesel'],
    'Electricity': ['electricity_india', 'electricity_us', 'electricity_eu', 'electricity_renewable'],
    'Business Travel': ['business_travel_flight_short', 'business_travel_flight_medium', 'business_travel_flight_long', 'business_travel_car', 'business_travel_train'],
    'Employee Commute': ['employee_commute_car', 'employee_commute_public'],
    'Waste': ['waste_landfill', 'waste_recycled'],
    'Other': ['water', 'paper'],
    'Shipping & Logistics': ['shipping_road', 'shipping_sea', 'shipping_air']
};

/**
 * Calculate CO2e emissions
 * Formula: CO2e = Quantity × Emission Factor
 * @param {string} factorKey - The emission factor key
 * @param {number} quantity - The quantity in the appropriate unit
 * @returns {object} - Calculation result with CO2e in kg
 */
function calculateEmission(factorKey, quantity) {
    const factor = EMISSION_FACTORS[factorKey];

    if (!factor) {
        throw new Error(`Unknown emission factor: ${factorKey}`);
    }

    const co2eKg = quantity * factor.factor;

    return {
        co2eKg: Math.round(co2eKg * 100) / 100, // Round to 2 decimal places
        co2eTonnes: Math.round((co2eKg / 1000) * 1000) / 1000, // Convert to tonnes
        factorUsed: factor.factor,
        unit: factor.unit,
        scope: factor.scope,
        description: factor.description
    };
}

/**
 * Get emission factor details
 * @param {string} factorKey - The emission factor key
 * @returns {object} - Factor details
 */
function getEmissionFactor(factorKey) {
    return EMISSION_FACTORS[factorKey] || null;
}

/**
 * Get all emission factors
 * @returns {object} - All emission factors
 */
function getAllEmissionFactors() {
    return EMISSION_FACTORS;
}

/**
 * Get categories with their factors
 * @returns {object} - Categories with factor keys
 */
function getCategories() {
    return CATEGORIES;
}

/**
 * Get factors by scope
 * @param {number} scope - The scope (1, 2, or 3)
 * @returns {object} - Factors for the specified scope
 */
function getFactorsByScope(scope) {
    const result = {};
    for (const [key, value] of Object.entries(EMISSION_FACTORS)) {
        if (value.scope === scope) {
            result[key] = value;
        }
    }
    return result;
}

module.exports = {
    EMISSION_FACTORS,
    CATEGORIES,
    calculateEmission,
    getEmissionFactor,
    getAllEmissionFactors,
    getCategories,
    getFactorsByScope
};
