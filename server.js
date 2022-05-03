const { Pairing } = require('./db');
const express = require('express');
const app = express();
const port = 8081;

app.get('/subs', async (req, res) => {
	let accounts = await Pairing.find({ is_subscribed: true }, 'lichess_username');
	res.json(accounts.map(x => x.lichess_username));
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});