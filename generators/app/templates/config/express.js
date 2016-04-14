import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import flash from 'connect-flash';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import router from '../app/router';

export default class ExpressApp {
	app;

	constructor(db) {
		this.app = express();

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

		router(this.app);
	}

	listen(port) {
		this.app.listen(port, function() {
			console.log('<%= name %> Service started on port ' + port);
		});
	}
}