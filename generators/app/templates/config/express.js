import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import flash from 'connect-flash';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import * as utils from './utils';
import path from 'path';

export default class ExpressApp {
	app;

	constructor(db) {
		this.app = express();

		utils.getGlobbedFiles('./app/models/**/*.js')
		.forEach((modelPath) => {
			require(path.resolve(modelPath));
		});

		this.app.set('showStackError', true);

		if (process.env.NODE_ENV === 'development' || process.env.NODE_LOGGING) {
			// Enable logger (morgan)
			app.use(morgan('dev', {
				skip: function(req) {
					return /^\/api\//.test(req.url) === false;
				}
			}));
		}		

		this.app.use(bodyParser.urlencoded({
			extended: true
		}));
		this.app.use(bodyParser.json());
		this.app.use(methodOverride());

		// CookieParser should be above session
		this.app.use(cookieParser());

		this.app.use(flash());

		// Globbing routing files
		utils.getGlobbedFiles('./app/routes/**/*.js')
		.forEach((routePath) => {
			require(path.resolve(routePath)).default(this.app);
		});
	}

	listen(port) {
		this.app.listen(port, function() {
			console.log('<%= name %> Service started on port ' + port);
		});
	}
}