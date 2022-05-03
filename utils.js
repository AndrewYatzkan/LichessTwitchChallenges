const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const COMMAND_REGEX = /^!lichess\s+([a-zA-Z0-9_-]{1,19}[a-zA-Z0-9]$)/;
const { Pairing } = require('./db');

module.exports.parseCommand = cmd => {
	let m = cmd.match(COMMAND_REGEX);
	return m ? m[1] : null;
};

module.exports.lichessAccountExists = async username => {
	let req = await fetch(`https://lichess.org/api/user/${username}`);
	return req.status === 200;
};

module.exports.insertOrUpdate = async (twitch_id, twitch_display_name, lichess_username, is_subscriber) => {
	try {
		await Pairing.updateOne({twitch_id}, {twitch_id, twitch_display_name, lichess_username, is_subscriber}, {upsert: true});
		return true;
	} catch (e) {
		console.log(`Error updating database: ${e}`);
		return false;
	}
};

module.exports.updateSubStatus = async (apiClient, streamerId) => {
	// streamerId = 424604010
	let pairings = await Pairing.find({}, 'twitch_id is_subscriber');
	const subs = await apiClient.subscriptions.getSubscriptionsPaginated(streamerId).getAll();
	for (let pairing of pairings) {
		let is_subscriber = subs.includes(pairing.twitch_id);
		if (pairing.is_subscriber != is_subscriber) {
			pairing.is_subscriber ^= 1;
			await pairing.save();
		}
	}
};