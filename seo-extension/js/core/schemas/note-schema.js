/**
 * Note Schema for RxDB
 * Defines the structure and validation for sticky notes with encryption
 */

export const noteSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 36
        },
        content: {
            type: 'string',
            maxLength: 100000 // 100KB max
        },
        color: {
            type: 'string',
            maxLength: 7 // #RRGGBB
        },
        domain: {
            type: 'string',
            maxLength: 255
        },
        categories: {
            type: 'array',
            items: {
                type: 'string'
            },
            default: []
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
    required: ['id', 'domain', 'createdAt', 'updatedAt'],
    indexes: ['domain', 'updatedAt']
};
