'use strict';

module.exports = function(grunt) {

	// Unified Watch Object
	var watchFiles = {
		serverJS: ['server.js', 'config/**/*.js', 'app/**/*.js'],
		buildJS: ['dist/**/*.js'],
		mochaTests: ['app/tests/**/*.js']
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['eslint', 'babel'],
				options: {
					livereload: false
				}
			}
		},
		eslint: {
			options: {
		        configFile: '.eslintrc'
	      	},
	        target: watchFiles.serverJS
	    },
		clean: {
		  build: ['dist'],
		},
		babel: {
			options: {
				sourceMap: true,
				presets: ['es2015', 'stage-0']
			},
			build: {
				files: [{
					expand: true,
					src: watchFiles.serverJS,
					dest: 'target/src/',
					ext: '.js'
				}]
			}
		},

		nodemon: {
			dev: {
				script: 'target/src/server.js',
				options: {
					nodeArgs: ['--debug'],
					ext: 'js,html',
					watch: watchFiles.buildJS,
					ignore: ['node_modules/**'],
					env: {
						MONGO_HOST: 'localhost'
					}
				}
			}
		},
		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		
		concurrent: {
			default: ['eslint', 'nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true,
				limit: 10
			}
		}
		
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	grunt.registerTask('default', ['clean', 'build', 'concurrent:default']);

	grunt.registerTask('build', ['eslint', 'clean', 'babel']);

};
