'use strict';

var _ = require('lodash');

function processAttributes(attrs) {
    function convertValue(value) {
        switch(value) {
            case 'string': return 'String';
            case 'object': return '{}';
            case 'id': return 'Schema.ObjectId';
            case 'date': return 'Date';
            case 'date.now': return 'Date.now()';
            case 'boolean': return 'Boolean';
            case 'number': return 'Number';
            default: return value
        };
    }

    return _.reduce(_.keys(attrs), function(result, key) {
        result[key] = convertValue(attrs[key]);
        return result;
    }, {});
}

function processProperties(properties) {
    return _.reduce(_.keys(properties), function(result, key) {
        result[key] = processAttributes(properties[key]);
        return result;
    }, {});
}

module.exports = function(name, schema) {
    var data = JSON.parse(schema.replace(/(\r\n|\n|\r|)/gm,''));
    delete data.properties.id;
    return {
        name: name,
        schemaName: _.capitalize(name),
        properties: processProperties(data.properties)
    };
};