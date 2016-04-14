'use strict';

var _ = require('lodash');

function processUri(uri) {
    var regId = /{(\S+)}/;
    var found = uri.match(regId);
    if (!!found) {
        return uri.replace(found[0], ':' + found[1]);
    }
    return uri;
}

function processRoutes(resource, uri) {
    if (!!resource.relativeUri) {
        uri = uri + processUri(resource.relativeUri);
    }

    var data = null;
    if (!!resource.methods) {
        data = {
            uri: uri,
            methods: resource.methods
        };
    }

    if (!!resource.resources) {
        var result = _.map(resource.resources, function(res) {
            return processRoutes(res, uri);
        });
        data = _.concat(data, result);
    }
    return data;    
}

module.exports = processRoutes;