'use strict';

module.exports = {
    config: require('./writeConfig'),
    app: require('./writeApp'),
    install: function() {
        //Install Dependencies
        this.npmInstall();
    }
};
