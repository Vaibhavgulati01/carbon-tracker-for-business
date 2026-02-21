const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { docClient, TABLES } = require('../config/dynamodb');
const { PutCommand, QueryCommand, DeleteCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const auth = require('../middleware/auth');
const { calculateEmission, getAllEmissionFactors, getCategories } = require('../utils/emissionCalculator');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// @route   GET /api/activities/factors
// @desc    Get all emission factors
// @access  Public
router.get('/factors', (req, res) => {
    res.json({
        factors: getAllEmissionFactors(),
        categories: getCategories()
    });
});

// @route   POST /api/activities
// @desc    Add a new activity and calculate emissions
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { category, subcategory, quantity, unit, date, location, description } = req.body;

        // Validation
        if (!category || !quantity || !date) {
            return res.status(400).json({ error: 'Please provide category, quantity, and date' });
        }

        // Get user's organization
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'Please create an organization first' });
        }

        // Calculate emissions
        let emissionResult;
        try {
            emissionResult = calculateEmission(subcategory || category, parseFloat(quantity));
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        // Create activity
        const activityId = uuidv4();
        const activity = {
            activityId,
            organizationId: orgId,
            category,
            subcategory: subcategory || category,
            quantity: parseFloat(quantity),
            unit: unit || emissionResult.unit,
            scope: emissionResult.scope,
            date,
            location: location || 'Not specified',
            description: description || '',
            co2eKg: emissionResult.co2eKg,
            co2eTonnes: emissionResult.co2eTonnes,
            factorUsed: emissionResult.factorUsed,
            createdBy: req.user.userId,
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.ACTIVITIES,
            Item: activity
        }));

        // Note: Calculation audit logging removed for simplicity
        // Can be re-enabled by creating CarbonTracker_Calculations table

        res.status(201).json({
            message: 'Activity added successfully',
            activity,
            emission: emissionResult
        });

    } catch (error) {
        console.error('Add activity error:', error);
        res.status(500).json({ error: 'Server error adding activity' });
    }
});

// @route   GET /api/activities
// @desc    Get all activities for an organization
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'No organization found' });
        }

        const { scope, startDate, endDate, category } = req.query;

        // Use Scan with filter instead of Query with GSI
        let filterExpression = 'organizationId = :orgId';
        const expressionValues = {
            ':orgId': orgId
        };

        if (scope) {
            filterExpression += ' AND scope = :scope';
            expressionValues[':scope'] = parseInt(scope);
        }

        if (category) {
            filterExpression += ' AND category = :category';
            expressionValues[':category'] = category;
        }

        if (startDate && endDate) {
            filterExpression += ' AND #date BETWEEN :startDate AND :endDate';
            expressionValues[':startDate'] = startDate;
            expressionValues[':endDate'] = endDate;
        }

        const params = {
            TableName: TABLES.ACTIVITIES,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionValues
        };

        if (startDate && endDate) {
            params.ExpressionAttributeNames = { '#date': 'date' };
        }

        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const result = await docClient.send(new ScanCommand(params));

        // Sort by date descending
        result.Items.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate totals
        let totalCO2e = 0;
        const scopeTotals = { 1: 0, 2: 0, 3: 0 };

        result.Items.forEach(item => {
            totalCO2e += item.co2eKg;
            scopeTotals[item.scope] = (scopeTotals[item.scope] || 0) + item.co2eKg;
        });

        res.json({
            activities: result.Items,
            count: result.Items.length,
            totals: {
                totalCO2eKg: Math.round(totalCO2e * 100) / 100,
                totalCO2eTonnes: Math.round((totalCO2e / 1000) * 1000) / 1000,
                scope1: Math.round(scopeTotals[1] * 100) / 100,
                scope2: Math.round(scopeTotals[2] * 100) / 100,
                scope3: Math.round(scopeTotals[3] * 100) / 100
            }
        });

    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Server error fetching activities' });
    }
});

// @route   POST /api/activities/bulk
// @desc    Bulk import activities from CSV
// @access  Private
router.post('/bulk', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a CSV file' });
        }

        const orgId = req.user.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'Please create an organization first' });
        }

        // Parse CSV
        const csvData = req.file.buffer.toString('utf-8');
        const lines = csvData.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV file must have headers and at least one data row' });
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['category', 'quantity', 'date'];

        for (const header of requiredHeaders) {
            if (!headers.includes(header)) {
                return res.status(400).json({
                    error: `Missing required header: ${header}`,
                    requiredHeaders,
                    providedHeaders: headers
                });
            }
        }

        const activities = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());

            if (values.length !== headers.length) {
                errors.push({ row: i + 1, error: 'Column count mismatch' });
                continue;
            }

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            try {
                const emissionResult = calculateEmission(
                    row.subcategory || row.category,
                    parseFloat(row.quantity)
                );

                const activityId = uuidv4();
                activities.push({
                    PutRequest: {
                        Item: {
                            activityId,
                            organizationId: orgId,
                            category: row.category,
                            subcategory: row.subcategory || row.category,
                            quantity: parseFloat(row.quantity),
                            unit: row.unit || emissionResult.unit,
                            scope: emissionResult.scope,
                            date: row.date,
                            location: row.location || 'Not specified',
                            description: row.description || '',
                            co2eKg: emissionResult.co2eKg,
                            co2eTonnes: emissionResult.co2eTonnes,
                            factorUsed: emissionResult.factorUsed,
                            createdBy: req.user.userId,
                            createdAt: new Date().toISOString()
                        }
                    }
                });
            } catch (err) {
                errors.push({ row: i + 1, error: err.message });
            }
        }

        // Batch write (max 25 items per batch)
        if (activities.length > 0) {
            const batches = [];
            for (let i = 0; i < activities.length; i += 25) {
                batches.push(activities.slice(i, i + 25));
            }

            for (const batch of batches) {
                await docClient.send(new BatchWriteCommand({
                    RequestItems: {
                        [TABLES.ACTIVITIES]: batch
                    }
                }));
            }
        }

        res.json({
            message: 'Bulk import completed',
            imported: activities.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Server error during bulk import' });
    }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        await docClient.send(new DeleteCommand({
            TableName: TABLES.ACTIVITIES,
            Key: { activityId: req.params.id }
        }));

        res.json({ message: 'Activity deleted successfully' });

    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Server error deleting activity' });
    }
});

module.exports = router;
