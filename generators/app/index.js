'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var glob = require('glob');
var raml = require('raml-parser');
var _ = require('lodash');
var q = require('q');
var util = require('util')


function scanForRamlFile(location) {
    var list = glob.sync(location + 'raml/**/*.raml');
    return _.map(list, function(item) {
        var serviceName = item.split('/')
                        .pop()
                        .split('.')
                        .shift();
        return {
            service: serviceName,
            link: item
        };
    });
}

function readRamlFile(list, callback) {
    var promises = _.map(list, function(item) {
        return raml.loadFile(path.resolve(item.link));
    })
    q.all(promises)
    .then(function(response) {
        var results = _.map(response, function(value, key) {
            return _.extend(list[key], {data: value});
        });
        callback(results);
    });
}

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

function processModel(name, schema) {
    var data = JSON.parse(schema.replace(/(\r\n|\n|\r|)/gm,''));
    delete data.properties.id;
    return {
        name: name,
        schemaName: _.capitalize(name),
        properties: processProperties(data.properties)
    };
}

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

module.exports = yeoman.Base.extend({


    //Configurations will be loaded here.
    prompting: {
        appGeneral: function() {
            var done = this.async();
            this.props = {};
            this.props.app = {
                name: 'wishlist',
                description: ''
            };
            done();

        //     this.prompt([
        //         {
        //             type: 'input',
        //             name: 'name',
        //             message: 'Your service name',
        //             default: this.appname
        //         }, {
        //             type: 'input',
        //             name: 'description',
        //             message: 'Your service\'s description',
        //             default: ''
        //         }
        //     ], function(answers) {
        //         this.props = {};
        //         this.props.app = answers;
        //         this.log(answers.name);
        //         done();
        //     }.bind(this));
        },
        ramlLocation: function() {
            var done = this.async();            
            this.prompt({
                name: 'ramlDir',
                message: 'Location to raml folder (default to current location):',
                default: './',
                validate: function(input) {
                    if (_.isEmpty(scanForRamlFile(input))) {
                        return 'There\'s no raml file in the given location'; 
                    }
                    return true;
                }
            }, function(answers) {
                this.props.ramlDir = scanForRamlFile(answers.ramlDir);
                done();
            }.bind(this));
        },
        raml: function() {
            var done = this.async();
            var choices = _.map(this.props.ramlDir, function(item) {
                return {name: item.service};
            });
            this.prompt([
                {
                    type: 'checkbox',
                    name: 'restApi',
                    message: 'Select REST service:',
                    choices: choices,
                    validate: function(answer) {
                        if (answer.length < 1) {
                            return 'You must select at least one service';
                        }
                        return true;
                    }
                }
            ], function(answers) {
                var ramlDir = this.props.ramlDir;
                var list = _.map(answers.restApi, function(item) {
                    return _.find(ramlDir, function(service) {
                        return service.service === item;
                    });
                });
                var vm = this;
                readRamlFile(list, function(results) {
                    vm.props.raml = results;
                    done();
                });
            }.bind(this));
        }
    },

    configuring: function() {
        _.each(this.props.raml, function(raml) {
            raml.processedData = processRamlFile(raml.data, raml.service);
        });
    },

    //Writing Logic here
    writing: {
        //Copy the configuration files
        config: function() {
            this.fs.copyTpl(
                this.templatePath('package.json'),
                this.destinationPath('package.json'), {
                    name: this.props.app.name,
                    description: this.props.app.description
                }
            );

            this.fs.copyTpl(
                this.templatePath('gruntfile.js'),
                this.destinationPath('gruntfile.js'), {
                    name: this.props.app.name,
                    description: this.props.app.description
                }
            );

            this.fs.copy(
                this.templatePath('._eslintrc'),
                this.destinationPath('.eslintrc')
            );

             this.fs.copy(
                this.templatePath('._gitignore'),
                this.destinationPath('.gitignore')
            );
        },

        //Copy application files
        app: function() {
            var vm = this;
            this.fs.copyTpl(
                this.templatePath('server.js'),
                this.destinationPath('server.js')                
            );

            this.fs.copyTpl(
                this.templatePath('config/express.js'),
                this.destinationPath('config/express.js'), {
                    name: this.props.app.name
                }
            );

            this.fs.copy(
                this.templatePath('config/utils.js'),
                this.destinationPath('config/utils.js')
            );

            this.fs.copyTpl(
                this.templatePath('config/config.js'),
                this.destinationPath('config/config.js'), {
                    name: this.props.app.name
                }
            );
            
            _.each(this.props.raml, function(service) {
                _.each(service.processedData.models, function(model) {
                    vm.fs.copyTpl(
                        vm.templatePath('app/models/index.js'),
                        vm.destinationPath('app/models/' + model.name + '.model.js'), {
                            model: model
                        }
                    );
                });

                vm.fs.copyTpl(
                    vm.templatePath('app/controllers/index.js'),
                    vm.destinationPath('app/controllers/' + service.service + '.controller.js'), {
                        name: service.service,
                        controllers: service.processedData.controllers
                    }
                );

                vm.fs.copyTpl(
                    vm.templatePath('app/routes/index.js'),
                    vm.destinationPath('app/routes/' + service.service + '.route.js'), {
                        name: service.service,
                        routes: service.processedData.routes
                    }
                );
            });
        },

        //Install Dependencies
        install: function() {
            this.npmInstall();
        }
    }
});
