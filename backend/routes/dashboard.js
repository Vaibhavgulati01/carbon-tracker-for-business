const express = require('express');
const { docClient, TABLES } = require('../config/dynamodb');
const { ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const auth = require('../middleware/auth');

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

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview with totals and scope breakdown
// @access  Private
router.get('/overview', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        // Get all activities for organization
        const activities = await getActivitiesForOrg(orgId);

        // Calculate totals
        let totalCO2e = 0;
        const scopeTotals = { 1: 0, 2: 0, 3: 0 };
        const categoryTotals = {};

        activities.forEach(activity => {
            totalCO2e += activity.co2eKg;
            scopeTotals[activity.scope] = (scopeTotals[activity.scope] || 0) + activity.co2eKg;
            categoryTotals[activity.category] = (categoryTotals[activity.category] || 0) + activity.co2eKg;
        });

        // Get organization details
        const orgResult = await docClient.send(new GetCommand({
            TableName: TABLES.ORGANIZATIONS,
            Key: { organizationId: orgId }
        }));

        res.json({
            organization: orgResult.Item || null,
            overview: {
                totalEmissions: {
                    kg: Math.round(totalCO2e * 100) / 100,
                    tonnes: Math.round((totalCO2e / 1000) * 1000) / 1000
                },
                activityCount: activities.length,
                scopeBreakdown: {
                    scope1: {
                        kg: Math.round(scopeTotals[1] * 100) / 100,
                        percentage: totalCO2e > 0 ? Math.round((scopeTotals[1] / totalCO2e) * 100) : 0
                    },
                    scope2: {
                        kg: Math.round(scopeTotals[2] * 100) / 100,
                        percentage: totalCO2e > 0 ? Math.round((scopeTotals[2] / totalCO2e) * 100) : 0
                    },
                    scope3: {
                        kg: Math.round(scopeTotals[3] * 100) / 100,
                        percentage: totalCO2e > 0 ? Math.round((scopeTotals[3] / totalCO2e) * 100) : 0
                    }
                },
                categoryBreakdown: Object.entries(categoryTotals)
                    .map(([category, kg]) => ({
                        category,
                        kg: Math.round(kg * 100) / 100,
                        percentage: totalCO2e > 0 ? Math.round((kg / totalCO2e) * 100) : 0
                    }))
                    .sort((a, b) => b.kg - a.kg)
            }
        });

    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ error: 'Server error fetching dashboard' });
    }
});

// @route   GET /api/dashboard/trends
// @desc    Get monthly emission trends
// @access  Private
router.get('/trends', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();

        // Get all activities for the organization and filter by year
        const allActivities = await getActivitiesForOrg(orgId);
        const activities = allActivities.filter(a => a.date && a.date.startsWith(String(targetYear)));

        // Group by month
        const monthlyData = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize all months
        months.forEach((month, index) => {
            monthlyData[index + 1] = { month, scope1: 0, scope2: 0, scope3: 0, total: 0 };
        });

        // Aggregate data
        activities.forEach(activity => {
            const month = new Date(activity.date).getMonth() + 1;
            if (monthlyData[month]) {
                monthlyData[month][`scope${activity.scope}`] += activity.co2eKg;
                monthlyData[month].total += activity.co2eKg;
            }
        });

        // Convert to array and round values
        const trends = Object.values(monthlyData).map(data => ({
            ...data,
            scope1: Math.round(data.scope1 * 100) / 100,
            scope2: Math.round(data.scope2 * 100) / 100,
            scope3: Math.round(data.scope3 * 100) / 100,
            total: Math.round(data.total * 100) / 100
        }));

        res.json({
            year: targetYear,
            trends
        });

    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ error: 'Server error fetching trends' });
    }
});

// @route   GET /api/dashboard/hotspots
// @desc    Get top emission sources
// @access  Private
router.get('/hotspots', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        const activities = await getActivitiesForOrg(orgId);

        // Group by subcategory
        const subcategoryTotals = {};
        let totalCO2e = 0;

        activities.forEach(activity => {
            const key = activity.subcategory || activity.category;
            subcategoryTotals[key] = (subcategoryTotals[key] || 0) + activity.co2eKg;
            totalCO2e += activity.co2eKg;
        });

        // Sort and get top 10
        const hotspots = Object.entries(subcategoryTotals)
            .map(([source, kg]) => ({
                source,
                kg: Math.round(kg * 100) / 100,
                percentage: totalCO2e > 0 ? Math.round((kg / totalCO2e) * 100) : 0
            }))
            .sort((a, b) => b.kg - a.kg)
            .slice(0, 10);

        res.json({ hotspots, totalSources: Object.keys(subcategoryTotals).length });

    } catch (error) {
        console.error('Hotspots error:', error);
        res.status(500).json({ error: 'Server error fetching hotspots' });
    }
});

// @route   GET /api/dashboard/category
// @desc    Get category-wise breakdown
// @access  Private
router.get('/category', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        const activities = await getActivitiesForOrg(orgId);

        // Group by category and scope
        const categoryData = {};

        activities.forEach(activity => {
            if (!categoryData[activity.category]) {
                categoryData[activity.category] = {
                    category: activity.category,
                    scope1: 0,
                    scope2: 0,
                    scope3: 0,
                    total: 0,
                    count: 0
                };
            }
            categoryData[activity.category][`scope${activity.scope}`] += activity.co2eKg;
            categoryData[activity.category].total += activity.co2eKg;
            categoryData[activity.category].count++;
        });

        // Convert to array and sort
        const categories = Object.values(categoryData)
            .map(cat => ({
                ...cat,
                scope1: Math.round(cat.scope1 * 100) / 100,
                scope2: Math.round(cat.scope2 * 100) / 100,
                scope3: Math.round(cat.scope3 * 100) / 100,
                total: Math.round(cat.total * 100) / 100
            }))
            .sort((a, b) => b.total - a.total);

        res.json({ categories });

    } catch (error) {
        console.error('Category breakdown error:', error);
        res.status(500).json({ error: 'Server error fetching category data' });
    }
});

module.exports = router;
