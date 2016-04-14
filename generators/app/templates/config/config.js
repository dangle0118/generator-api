export let config = {
	app: {
		title: 'Leflair Vietnam - <%= name %> Service'
	},
	port: process.env.PORT || 3000,
	db: {
		uri: 'mongodb://' + process.env.MONGO_HOST + '/wishlist-leflair',
		options: {
			user: process.env.MONGO_USER,
			pass: process.env.MONGO_PASSWORD
		}
	}
};