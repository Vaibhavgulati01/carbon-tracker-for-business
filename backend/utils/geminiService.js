const Groq = require('groq-sdk');

// Initialize Groq AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate emission insights based on organization data
 */
async function generateInsights(data) {
  const prompt = `You are an expert carbon emissions analyst. Analyze the following emission data for a ${data.industry} company and provide actionable insights.

EMISSION DATA:
- Total Emissions: ${data.totalEmissions.toFixed(2)} kg CO2e (${(data.totalEmissions / 1000).toFixed(2)} tonnes)
- Scope 1 (Direct): ${data.scope1.toFixed(2)} kg CO2e (${data.scope1Percentage}%)
- Scope 2 (Energy): ${data.scope2.toFixed(2)} kg CO2e (${data.scope2Percentage}%)
- Scope 3 (Value Chain): ${data.scope3.toFixed(2)} kg CO2e (${data.scope3Percentage}%)

TOP EMISSION SOURCES:
${data.hotspots.map((h, i) => `${i + 1}. ${h.source}: ${h.kg.toFixed(2)} kg CO2e (${h.percentage}%)`).join('\n')}

Employee Count: ${data.employeeCount || 'Not specified'}

Provide your analysis in the following JSON format:
{
  "summary": "2-3 sentence summary of overall emissions profile",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "recommendations": [
    {"action": "action description", "potentialReduction": "X%", "priority": "high/medium/low"}
  ],
  "industryComparison": "How this compares to industry average",
  "quickWins": ["quick win 1", "quick win 2"]
}

Respond ONLY with valid JSON, no markdown or additional text.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });

    const text = response.choices[0]?.message?.content || '';
    const cleanResponse = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Groq AI Error:', error.message);
    return {
      summary: 'Unable to generate AI insights at this time.',
      keyFindings: ['Analysis temporarily unavailable'],
      recommendations: [],
      industryComparison: 'Comparison unavailable',
      quickWins: []
    };
  }
}

/**
 * Simulate what-if scenarios
 */
async function simulateScenario(currentData, scenario) {
  const prompt = `You are a carbon emissions scenario analyst. Based on the current emission data and the proposed scenario, predict the impact.

CURRENT EMISSIONS:
- Total: ${currentData.totalEmissions.toFixed(2)} kg CO2e
- Scope 1: ${currentData.scope1.toFixed(2)} kg CO2e
- Scope 2: ${currentData.scope2.toFixed(2)} kg CO2e
- Scope 3: ${currentData.scope3.toFixed(2)} kg CO2e

SCENARIO TO ANALYZE:
${scenario.description}

Provide a detailed analysis in the following JSON format:
{
  "scenarioName": "Brief name for this scenario",
  "predictedReduction": {
    "percentage": 15,
    "kgCO2e": 1000,
    "tonnesCO2e": 1
  },
  "newTotals": {
    "total": 5000,
    "scope1": 1000,
    "scope2": 2000,
    "scope3": 2000
  },
  "implementation": {
    "difficulty": "easy/medium/hard",
    "timeframe": "short-term/medium-term/long-term",
    "estimatedCost": "low/medium/high"
  },
  "benefits": ["benefit1", "benefit2"],
  "challenges": ["challenge1", "challenge2"],
  "nextSteps": ["step1", "step2"]
}

Use realistic numbers based on the scenario. Respond ONLY with valid JSON.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });

    const text = response.choices[0]?.message?.content || '';
    const cleanResponse = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Groq Scenario Error:', error.message);
    return {
      scenarioName: scenario.description,
      predictedReduction: { percentage: 0, kgCO2e: 0, tonnesCO2e: 0 },
      newTotals: currentData,
      implementation: { difficulty: 'unknown', timeframe: 'unknown', estimatedCost: 'unknown' },
      benefits: ['Unable to analyze'],
      challenges: ['Analysis temporarily unavailable'],
      nextSteps: []
    };
  }
}

/**
 * Generate reduction recommendations
 */
async function generateRecommendations(data) {
  const prompt = `You are a sustainability consultant. Based on the emission profile, suggest specific reduction strategies.

EMISSION PROFILE:
- Industry: ${data.industry}
- Total Emissions: ${data.totalEmissions.toFixed(2)} kg CO2e
- Top Sources: ${data.hotspots.slice(0, 5).map(h => h.source).join(', ')}
- Scope with highest emissions: Scope ${data.highestScope}

Provide 5 actionable recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "Short title",
      "description": "Detailed description",
      "category": "Energy/Transport/Waste/Procurement/Operations",
      "targetScope": 1,
      "estimatedReduction": "10-15%",
      "implementation": "How to implement",
      "timeline": "6 months",
      "roi": "high"
    }
  ]
}

Respond ONLY with valid JSON.`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });

    const text = response.choices[0]?.message?.content || '';
    const cleanResponse = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Groq Recommendations Error:', error.message);
    return { recommendations: [] };
  }
}

module.exports = {
  generateInsights,
  simulateScenario,
  generateRecommendations
};
