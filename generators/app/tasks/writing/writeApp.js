'use strict';

var _ = require('lodash');

module.exports = function() {
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

};