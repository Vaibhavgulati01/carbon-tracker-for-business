const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { docClient, TABLES } = require('../config/dynamodb');
const { PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const auth = require('../middleware/auth');

const router = express.Router();

// Industry types
const INDUSTRY_TYPES = [
    'Technology',
    'Manufacturing',
    'Retail',
    'Healthcare',
    'Transportation',
    'Energy',
    'Finance',
    'Construction',
    'Agriculture',
    'Other'
];

// @route   POST /api/organizations
// @desc    Create a new organization
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, industry, employeeCount, reportingYear, operationalBoundary } = req.body;

        // Validation
        if (!name || !industry) {
            return res.status(400).json({ error: 'Please provide organization name and industry' });
        }

        if (!INDUSTRY_TYPES.includes(industry)) {
            return res.status(400).json({
                error: 'Invalid industry type',
                validTypes: INDUSTRY_TYPES
            });
        }

        // Create organization
        const organizationId = uuidv4();
        const organization = {
            organizationId,
            name,
            industry,
            employeeCount: employeeCount || 0,
            reportingYear: reportingYear || new Date().getFullYear(),
            operationalBoundary: operationalBoundary || 'single-site',
            createdBy: req.user.userId,
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.ORGANIZATIONS,
            Item: organization
        }));

        // Update user with organization ID
        await docClient.send(new UpdateCommand({
            TableName: TABLES.USERS,
            Key: { userId: req.user.userId },
            UpdateExpression: 'SET organizationId = :orgId',
            ExpressionAttributeValues: {
                ':orgId': organizationId
            }
        }));

        // Generate a NEW JWT token that includes the organizationId
        const newToken = jwt.sign(
            {
                userId: req.user.userId,
                email: req.user.email,
                role: req.user.role,
                organizationId: organizationId  // Include the new org ID!
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Organization created successfully',
            organization,
            token: newToken  // Return new token to frontend
        });

    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({ error: 'Server error creating organization' });
    }
});

// @route   GET /api/organizations/:id
// @desc    Get organization by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.ORGANIZATIONS,
            Key: { organizationId: req.params.id }
        }));

        if (!result.Item) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json({ organization: result.Item });

    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/organizations/:id
// @desc    Update organization
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, industry, employeeCount, reportingYear, operationalBoundary } = req.body;

        // Build update expression
        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionValues = {
            ':updatedAt': new Date().toISOString()
        };

        if (name) {
            updateExpression += ', #name = :name';
            expressionValues[':name'] = name;
        }
        if (industry) {
            updateExpression += ', industry = :industry';
            expressionValues[':industry'] = industry;
        }
        if (employeeCount !== undefined) {
            updateExpression += ', employeeCount = :employeeCount';
            expressionValues[':employeeCount'] = employeeCount;
        }
        if (reportingYear) {
            updateExpression += ', reportingYear = :reportingYear';
            expressionValues[':reportingYear'] = reportingYear;
        }
        if (operationalBoundary) {
            updateExpression += ', operationalBoundary = :operationalBoundary';
            expressionValues[':operationalBoundary'] = operationalBoundary;
        }

        const result = await docClient.send(new UpdateCommand({
            TableName: TABLES.ORGANIZATIONS,
            Key: { organizationId: req.params.id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: name ? { '#name': 'name' } : undefined,
            ExpressionAttributeValues: expressionValues,
            ReturnValues: 'ALL_NEW'
        }));

        res.json({
            message: 'Organization updated successfully',
            organization: result.Attributes
        });

    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({ error: 'Server error updating organization' });
    }
});

// @route   GET /api/organizations/industries/list
// @desc    Get list of industry types
// @access  Public
router.get('/industries/list', (req, res) => {
    res.json({ industries: INDUSTRY_TYPES });
});

module.exports = router;
