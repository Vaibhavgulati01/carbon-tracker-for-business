const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// Create DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    ...(process.env.AWS_ACCESS_KEY_ID && {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    })
});

// Create document client for easier operations
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true
    }
});

// Table names
const TABLES = {
    USERS: 'CarbonTracker_Users',
    ORGANIZATIONS: 'CarbonTracker_Organizations',
    ACTIVITIES: 'CarbonTracker_Activities',
    EMISSION_FACTORS: 'CarbonTracker_EmissionFactors',
    CALCULATIONS: 'CarbonTracker_Calculations',
    SCENARIOS: 'CarbonTracker_Scenarios'
};

module.exports = { client, docClient, TABLES };
