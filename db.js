const mongoose = require('mongoose');

// load environment variables
require('dotenv').config();

// get connection string
const CONNECTION_STRING = process.env.CONNECTION_STRING;

// connect to database
mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.once("open", () => console.log("MongoDB database connection established successfully"));

// create pairing schema
const PairingSchema = new mongoose.Schema({
	twitch_id: {
		type: Number,
		required: true,
		unique: true,
		index: true
	},
	twitch_display_name: {
		type: String,
		required: true,
		unique: true,
		minLength: 4,
		maxLength: 25
	},
	lichess_username: {
		type: String,
		required: true,
		minLength: 2,
		maxLength: 20
	},
	is_subscriber: {
		type: Boolean,
		default: false
	}
}, {timestamps: { createdAt: false, updatedAt: true }, versionKey: false});

module.exports.Pairing = mongoose.model('Pairing', PairingSchema);