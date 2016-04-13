'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var async = require('async');
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
        // var methods = _.map(resource.methods, function(method) {
        //     return {
        //         method: method.method,
        //         description: method.description,
        //     }
        // })
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

    console.log('controller', controllers);

    return {
        routes: routes,
        controllers: controllers
    };
}

module.exports = yeoman.Base.extend({


    //Configurations will be loaded here.
    prompting: {
        // appGeneral: function() {
        //     var done = this.async();

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
        // },
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
                this.props = {};
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
        })
    },

    //Writing Logic here
    writing: {
        //Copy the configuration files
        // config: function() {
        //     this.fs.copyTpl(
        //         this.templatePath('package.json'),
        //         this.destinationPath('package.json'), {
        //             name: this.props.app.name,
        //             description: this.props.app.description
        //         }
        //     );
        // },

        //Copy application files
        app: function() {
            var vm = this;
            // this.fs.copyTpl(
            //     this.templatePath('server.js'),
            //     this.destinationPath('server.js')                
            // );
            
            _.each(this.props.raml, function(service) {

                // console.log(util.inspect(service, false, null));

                vm.fs.copyTpl(
                    vm.templatePath('controllers/index.js'),
                    vm.destinationPath('controllers/' + service.service + '.controller.js'), {
                        name: service.service,
                        controllers: service.processedData.controllers
                    }
                );

                vm.fs.copyTpl(
                    vm.templatePath('routes/index.js'),
                    vm.destinationPath('routes/' + service.service + '.route.js'), {
                        name: service.service,
                        routes: service.processedData.routes
                    }
                );
            });
                        

            // this.fs.copy(
            //     this.templatePath('_models/_todo.js'),
            //     this.destinationPath('models/todo.js')
            // );
        },

        //Install Dependencies
        install: function() {
            // this.npmInstall();
        }
    }
});
