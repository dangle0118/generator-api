'use strict';

var _ = require('lodash');

function processResponses(responses) {
    var data = {};
    _.each(responses, function(response, key) {
        if (response.body && response.body['application/json']) {
            data[key] = JSON.parse(response.body['application/json'].example
                        .replace(/(\r\n|\n|\r|)/gm,''));
        }
    });
    return data;
}

function processController(resource) {
    var data = [];
    if (!!resource.methods) {
        _.each(resource.methods, function(method) {
            data.push({
                name: method.displayName,
                responses: processResponses(method.responses),
                body: method.body,
                method: method.method
            });
        });
    }

    if (!!resource.resources) {
        var result = _.map(resource.resources, function(res) {
            return processController(res);
        })
        data = _.concat(data, result);
    }
    return data;
}

module.exports = processController;
