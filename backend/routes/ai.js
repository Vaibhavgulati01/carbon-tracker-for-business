const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { docClient, TABLES } = require('../config/dynamodb');
const { ScanCommand, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const auth = require('../middleware/auth');
const { generateInsights, simulateScenario, generateRecommendations } = require('../utils/geminiService');

const router = express.Router();

// Helper function to get activities for an organization using Scan
async function getActivitiesForOrg(orgId) {
    const result = await docClient.send(new ScanCommand({
        TableName: TABLES.ACTIVITIES,
        FilterExpression: 'organizationId = :orgId',
        ExpressionAttributeValues: { ':orgId': orgId }
    }));
    return result.Items || [];
}

// @route   GET /api/ai/insights
// @desc    Get AI-generated insights for organization emissions
// @access  Private
router.get('/insights', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        // Get organization data
        const orgResult = await docClient.send(new GetCommand({
            TableName: TABLES.ORGANIZATIONS,
            Key: { organizationId: orgId }
        }));

        // Get activities using Scan
        const activities = await getActivitiesForOrg(orgId);

        if (activities.length === 0) {
            return res.json({
                insights: {
                    summary: 'No emission data available yet. Add activities to get AI-powered insights.',
                    keyFindings: ['Add emission activities to see insights'],
                    recommendations: [],
                    industryComparison: 'Not available',
                    quickWins: []
                }
            });
        }

        // Calculate totals for AI
        let totalEmissions = 0;
        const scopeTotals = { 1: 0, 2: 0, 3: 0 };
        const subcategoryTotals = {};

        activities.forEach(activity => {
            totalEmissions += activity.co2eKg;
            scopeTotals[activity.scope] += activity.co2eKg;
            const key = activity.subcategory || activity.category;
            subcategoryTotals[key] = (subcategoryTotals[key] || 0) + activity.co2eKg;
        });

        const hotspots = Object.entries(subcategoryTotals)
            .map(([source, kg]) => ({
                source,
                kg,
                percentage: totalEmissions > 0 ? Math.round((kg / totalEmissions) * 100) : 0
            }))
            .sort((a, b) => b.kg - a.kg)
            .slice(0, 5);

        const data = {
            industry: orgResult.Item?.industry || 'General',
            employeeCount: orgResult.Item?.employeeCount,
            totalEmissions,
            scope1: scopeTotals[1],
            scope2: scopeTotals[2],
            scope3: scopeTotals[3],
            scope1Percentage: totalEmissions > 0 ? Math.round((scopeTotals[1] / totalEmissions) * 100) : 0,
            scope2Percentage: totalEmissions > 0 ? Math.round((scopeTotals[2] / totalEmissions) * 100) : 0,
            scope3Percentage: totalEmissions > 0 ? Math.round((scopeTotals[3] / totalEmissions) * 100) : 0,
            hotspots
        };

        const insights = await generateInsights(data);

        res.json({ insights, dataUsed: data });

    } catch (error) {
        console.error('AI insights error:', error);
        res.status(500).json({ error: 'Server error generating insights' });
    }
});

// @route   POST /api/ai/scenario
// @desc    Run what-if scenario simulation
// @access  Private
router.post('/scenario', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        const { description, parameters } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Please provide a scenario description' });
        }

        // Get current emissions using Scan
        const activities = await getActivitiesForOrg(orgId);

        let totalEmissions = 0;
        const scopeTotals = { 1: 0, 2: 0, 3: 0 };

        activities.forEach(activity => {
            totalEmissions += activity.co2eKg;
            scopeTotals[activity.scope] += activity.co2eKg;
        });

        const currentData = {
            totalEmissions,
            scope1: scopeTotals[1],
            scope2: scopeTotals[2],
            scope3: scopeTotals[3]
        };

        const scenario = { description, parameters };

        const analysis = await simulateScenario(currentData, scenario);

        // Save scenario for history
        const scenarioId = uuidv4();
        await docClient.send(new PutCommand({
            TableName: TABLES.SCENARIOS,
            Item: {
                scenarioId,
                organizationId: orgId,
                description,
                parameters: parameters || {},
                currentData,
                analysis,
                createdBy: req.user.userId,
                createdAt: new Date().toISOString()
            }
        }));

        res.json({
            scenarioId,
            currentEmissions: currentData,
            analysis
        });

    } catch (error) {
        console.error('Scenario simulation error:', error);
        res.status(500).json({ error: 'Server error running scenario' });
    }
});

// @route   GET /api/ai/recommendations
// @desc    Get reduction recommendations
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        // Get organization and activities
        const orgResult = await docClient.send(new GetCommand({
            TableName: TABLES.ORGANIZATIONS,
            Key: { organizationId: orgId }
        }));

        const activities = await getActivitiesForOrg(orgId);

        if (activities.length === 0) {
            return res.json({
                recommendations: {
                    recommendations: [
                        {
                            title: 'Start Tracking',
                            description: 'Add your first emission activities to get personalized recommendations.',
                            category: 'Operations',
                            targetScope: 1,
                            estimatedReduction: 'N/A',
                            implementation: 'Use the activity logging feature',
                            timeline: 'Immediate',
                            roi: 'high'
                        }
                    ]
                }
            });
        }

        // Calculate data for recommendations
        let totalEmissions = 0;
        const scopeTotals = { 1: 0, 2: 0, 3: 0 };
        const subcategoryTotals = {};

        activities.forEach(activity => {
            totalEmissions += activity.co2eKg;
            scopeTotals[activity.scope] += activity.co2eKg;
            const key = activity.subcategory || activity.category;
            subcategoryTotals[key] = (subcategoryTotals[key] || 0) + activity.co2eKg;
        });

        const hotspots = Object.entries(subcategoryTotals)
            .map(([source, kg]) => ({ source, kg }))
            .sort((a, b) => b.kg - a.kg);

        // Find highest scope
        let highestScope = 1;
        if (scopeTotals[2] > scopeTotals[highestScope]) highestScope = 2;
        if (scopeTotals[3] > scopeTotals[highestScope]) highestScope = 3;

        const data = {
            industry: orgResult.Item?.industry || 'General',
            totalEmissions,
            hotspots,
            highestScope
        };

        const recommendations = await generateRecommendations(data);

        res.json(recommendations);

    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ error: 'Server error generating recommendations' });
    }
});

// @route   GET /api/ai/scenarios
// @desc    Get saved scenarios
// @access  Private
router.get('/scenarios', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        // Use Scan instead of Query with GSI
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.SCENARIOS,
            FilterExpression: 'organizationId = :orgId',
            ExpressionAttributeValues: { ':orgId': orgId }
        }));

        // Sort by createdAt descending
        const scenarios = (result.Items || []).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({ scenarios });

    } catch (error) {
        console.error('Get scenarios error:', error);
        res.status(500).json({ error: 'Server error fetching scenarios' });
    }
});

module.exports = router;
