require('dotenv').config();
const { RefreshingAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');
const { ChatClient } = require('@twurple/chat');
const { promises: fs } = require('fs');
const utils = require('./utils');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const STREAMER_USERNAME = process.env.STREAMER_USERNAME;
const STREAMER_ID = parseInt(process.env.STREAMER_ID);

async function getAuthProvider(tokensFile) {
	let tokenData = JSON.parse(await fs.readFile(tokensFile, 'UTF-8'));
	return new RefreshingAuthProvider({
	    clientId: CLIENT_ID,
	    clientSecret: CLIENT_SECRET,
	    onRefresh: async (newTokenData) => await fs.writeFile(tokensFile, JSON.stringify(newTokenData, null, 4), 'UTF-8')
	}, tokenData);
	return new ApiClient({ authProvider });
}

(async () => {
	// streamer authentication
	const clients = {
		api: new ApiClient({ authProvider: await getAuthProvider('./streamer_tokens.json') }),
		chat: new ChatClient({ authProvider: await getAuthProvider('./bot_tokens.json'), channels: [STREAMER_USERNAME] })
	};

	// daily prune of unsubscribed accounts
	setInterval(utils.updateSubStatus.bind(null, clients.api, STREAMER_ID), 1000 * 60 * 60 * 24);

	// wait for chat client to connect
	await clients.chat.connect();

	// listen for !lichess
	clients.chat.onMessage(async (channel, username, message, { userInfo }) => {
		let { isSubscriber, userId: twitchId, displayName: twitchDisplayName } = userInfo;
		// console.log(isSubscriber, userId); // userInfo.displayName exists
		let lichessUsername = utils.parseCommand(message);

		// verify that command is formatted properly
		if (!lichessUsername) return;
		
		// verify that lichess account exists
		if (!(await utils.lichessAccountExists(lichessUsername))) return clients.chat.say(channel, `Lichess account ${lichessUsername} doesn't seem to exist!`);

		// update database
		if (!(await utils.insertOrUpdate(twitchId, twitchDisplayName, lichessUsername, isSubscriber))) return clients.chat.say(channel, `Uh oh! There seems to be a database error`);

		clients.chat.say(channel, `Paired lichess account ${lichessUsername} to @${twitchDisplayName}`);
	});

	// TODO: EVENTSUB to listen for new subs
	// TODO: updateSubStatus: does getAll return an array of user ids or usernames?
	// TODO: rate limiting

})();

/*
GET ACCESS & REFRESH TOKENS:

https://id.twitch.tv/oauth2/authorize?client_id=...
	&redirect_uri=http://localhost
	&response_type=code
	&scope=channel:read:subscriptions

OR (diff scope)

https://id.twitch.tv/oauth2/authorize?client_id=...
	&redirect_uri=http://localhost
	&response_type=code
	&scope=chat:read+chat:edit


USE CODE:

curl -X POST:

https://id.twitch.tv/oauth2/token?client_id=...
    &client_secret=...
    &code=...
    &grant_type=authorization_code
    &redirect_uri=http://localhost
*/