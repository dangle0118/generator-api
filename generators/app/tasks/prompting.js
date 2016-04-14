'use strict';

var path = require('path');
var glob = require('glob');
var raml = require('raml-parser');
var _ = require('lodash');
var q = require('q');

function scanForRamlFile(location) {
    var list = glob.sync(path.resolve(location, '**/*.raml'));
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

function promptGeneral() {
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
}

function promptRamlLocation() {
	var done = this.async();            
    this.prompt({
        name: 'ramlDir',
        message: 'Location to raml folder (default to current location):',
        default: './raml',
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
}

function promptRaml() {
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

module.exports = {
	promptGeneral: promptGeneral,
	promptRamlLocation: promptRamlLocation,
	promptRaml: promptRaml
};