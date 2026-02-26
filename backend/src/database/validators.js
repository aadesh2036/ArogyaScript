/**
 * MongoDB Collection-Level JSON Schema Validators
 *
 * Enforces data integrity at the database level,
 * independent of Mongoose schema validation.
 */

const VALIDATORS = [
    {
        collection: 'users',
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'email', 'passwordHash', 'role'],
                properties: {
                    name: { bsonType: 'string', description: 'must be a string' },
                    email: { bsonType: 'string', pattern: '^\\S+@\\S+\\.\\S+$' },
                    passwordHash: { bsonType: 'string' },
                    role: { bsonType: 'string', enum: ['doctor', 'pharmacist', 'patient', 'admin'] },
                },
            },
        },
        validationLevel: 'moderate',
        validationAction: 'warn',
    },
    {
        collection: 'prescriptions',
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['userId', 'imagePath', 'pipelineStatus'],
                properties: {
                    pipelineStatus: {
                        bsonType: 'string',
                        enum: ['uploaded', 'processing', 'processed', 'failed'],
                    },
                },
            },
        },
        validationLevel: 'moderate',
        validationAction: 'warn',
    },
    {
        collection: 'riskscores',
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['prescriptionId', 'overallScore', 'category'],
                properties: {
                    overallScore: { bsonType: 'number', minimum: 0, maximum: 100 },
                    category: { bsonType: 'string', enum: ['low', 'moderate', 'high'] },
                },
            },
        },
        validationLevel: 'strict',
        validationAction: 'warn',
    },
    {
        collection: 'interactionkbs',
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['drugA', 'drugB', 'severity'],
                properties: {
                    severity: { bsonType: 'string', enum: ['low', 'moderate', 'high'] },
                },
            },
        },
        validationLevel: 'moderate',
        validationAction: 'warn',
    },
];

module.exports = VALIDATORS;
