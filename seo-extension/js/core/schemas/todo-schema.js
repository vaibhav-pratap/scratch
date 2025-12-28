/**
 * Todo Schema for RxDB
 * Defines the structure and validation for todo items with encryption
 */

export const todoSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 36
        },
        text: {
            type: 'string',
            maxLength: 10000
        },
        completed: {
            type: 'boolean',
            default: false
        },
        priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        dueDate: {
            type: ['number', 'null'],
            default: null
        },
        tags: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
        },
        categories: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
        },
        color: {
            type: 'string',
            maxLength: 7
        },
        subtasks: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    text: { type: 'string' },
                    completed: { type: 'boolean' }
                }
            },
            default: []
        },
        notes: {
            type: 'string',
            maxLength: 5000,
            default: ''
        },
        domain: {
            type: 'string',
            maxLength: 255
        },
        createdAt: {
            type: 'number',
            minimum: 0,
            maximum: 9999999999999,
            multipleOf: 1
        },
        updatedAt: {
            type: 'number',
            minimum: 0,
            maximum: 9999999999999,
            multipleOf: 1
        }
    },
    required: ['id', 'text', 'domain', 'createdAt', 'updatedAt'],
    indexes: ['domain', 'updatedAt', 'completed']
};
