'use strict';

var _ = require('lodash');

var processRoutes = require('./processRoute');
var processController = require('./processController');
var processModel = require('./processModel');

function processRamlFile(raml) {
    raml.baseUri = raml.baseUri.replace('{version}', raml.version);

    //process Routing
    var routes = [];
    _.each(raml.resources, function(resource) {
        routes = _.concat(routes, processRoutes(resource, raml.baseUri));
    });

    //process Controller
    var controllers = [];
    _.each(routes, function(resource) {
        controllers = _.concat(controllers, processController(resource));
    });

    //process Models
    var models = [];
    _.each(raml.schemas, function(schema) {
        _.each(_.toPairs(schema), function(collection) {
            models = _.concat(models, processModel(collection[0], collection[1]));
        });
    });



    return {
        routes: routes,
        controllers: controllers,
        models: models
    };
}

module.exports = function() {
    _.each(this.props.raml, function(raml) {
        raml.processedData = processRamlFile(raml.data, raml.service);
    });
};
