/**
 * Category Schema for RxDB
 * Defines the structure and validation for categories
 */

export const categorySchema = {
    version: 0,
    primaryKey: 'name',
    type: 'object',
    properties: {
        name: {
            type: 'string',
            maxLength: 100
        },
        domain: {
            type: 'string',
            maxLength: 255
        },
        usageCount: {
            type: 'number',
            minimum: 0,
            maximum: 999999,
            multipleOf: 1,
            default: 0
        }
    },
    required: ['name', 'domain'],
    indexes: ['domain', 'usageCount']
};
