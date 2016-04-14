'use strict';

module.exports = function() {
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
};