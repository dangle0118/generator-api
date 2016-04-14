'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var glob = require('glob');
var raml = require('raml-parser');
var _ = require('lodash');
var q = require('q');
var util = require('util');

var prompting = require('./tasks/prompting');
var configuring = require('./tasks/configuring');
var writing = require('./tasks/writing');

module.exports = yeoman.Base.extend({
    prompting: prompting,
    configuring: configuring,
    writing: writing
});
