const jwt = require('jsonwebtoken');
const { docClient, TABLES } = require('../config/dynamodb');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided. Authorization denied.' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user data from database to get latest organizationId
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { userId: decoded.userId }
        }));

        if (!result.Item) {
            return res.status(401).json({ error: 'User not found. Authorization denied.' });
        }

        // Add fresh user info to request (includes organizationId)
        req.user = {
            userId: result.Item.userId,
            email: result.Item.email,
            name: result.Item.name,
            role: result.Item.role,
            organizationId: result.Item.organizationId
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired. Please login again.' });
        }
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Invalid token. Authorization denied.' });
    }
};

module.exports = auth;
