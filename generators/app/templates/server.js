import mongoose from 'mongoose';
import chalk from 'chalk';
import { config } from './config/config';
import ExpressApp from './config/express';

var db = mongoose.connect(config.db.uri, config.db.options, (err) => {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
});

var app = new ExpressApp(db);

app.listen(config.port);