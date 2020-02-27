// imports
const TwitchClient = require('twitch').default;
const ChatClient = require('twitch-chat-client').default;
const fs = require('fs-extra');

const util = require('./util');
const modifier = require('./modify-bot-channels');
const tokensFile = './tokens.json.bak';
const channelsFile = './channels.json';

// wrapped in async to allow for awaits
(async() =>
{
	// constant / variable declarations
	const baseOz = 4;
	const baseMl = 120;

	var botChannels = await fs.readJson(channelsFile);
	const tokenData = await fs.readJson(tokensFile);
	const twitchClient = await TwitchClient.withCredentials(tokenData.clientId, tokenData.accessToken, undefined,
								{
									clientSecret: tokenData.clientSecret,
									expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
									refreshToken: tokenData.refreshToken,
									onRefresh: await writeNewData(tokenData)
								});
	const chatClient = await ChatClient.forTwitchClient(twitchClient, {channels: Object.keys(botChannels)});

	await chatClient.connect();
	console.log(`${(new Date()).toTimeString()}: [+] Connected.`);
	console.log(`${(new Date()).toTimeString()}: [+] In channels: ${Object.keys(botChannels)}`);

	// set up listener for privmsgs, used here to implement !commands
	chatClient.onPrivmsg((channel, user, message) =>
	{
		(async() =>
		{
			botChannels = await fs.readJson(channelsFile);

			if (message.startsWith('!addbot') && channel === '#openhydrate')
			{
				modifier.addUser(chatClient, '#'+user);
			}

			if (message.startsWith('!removebot') && channel === '#openhydrate')
			{
				modifier.removeUser(chatClient, '#'+user);
			}

			if (message.startsWith('!ping'))
			{
				console.log(`${(new Date()).toTimeString()}: [D] Received !ping.`)
				chatClient.say(channel, 'Pong!');
			}

			if (message.startsWith('!color') || message.startsWith('!colour'))
			{
				botChannels[channel].color = true;
				await fs.writeJson(channelsFile, botChannels, {spaces: '\t'})
					.then(result =>
					{
						console.log(`${(new Date()).toTimeString()}: [D] ${channel}.color set to ${botChannels[channel].color}.`);
						chatClient.say(channel, `color has been set to ${botChannels[channel].color}.`);
					});
			}

			if (message.startsWith('!nocolor') || message.startsWith('!nocolour'))
			{
				botChannels[channel].color = false;
				await fs.writeJson(channelsFile, botChannels, {spaces: '\t'})
					.then(result =>
					{
						console.log(`${(new Date()).toTimeString()}: [D] ${channel}.color set to ${botChannels[channel].color}.`);
						chatClient.say(channel, `color has been set to ${botChannels[channel].color}.`);
					});
			}

			// if we directly ask for hydrate, regardless of time since last reminder
			if (message.startsWith('!hydrate'))
			{
				uptimeMinutes = await util.getUptimeInMinutes(twitchClient, channel);
				uptimeHours = Math.floor(uptimeMinutes / 60);
				console.log(`${(new Date()).toTimeString()}: [D] Recieved !hydrate.`);
				if (botChannels[channel].color)
				{
					chatClient.action(channel, `You've been live for just over ${uptimeHours} hours. By this point in your broadcast, you should have consumed ${baseOz * uptimeHours}oz (${baseMl * uptimeHours}ml) of water to maintain optimal hydration.`);
				}
				else
				{
					chatClient.say(channel, `You've been live for just over ${uptimeHours} hours. By this point in your broadcast, you should have consumed ${baseOz * uptimeHours}oz (${baseMl * uptimeHours}ml) of water to maintain optimal hydration.`);
				}
			}
		})();
	});

	// callback function for token auto-refresh
	async function writeNewData(newTokens)
	{
		await fs.writeJson(tokensFile, newTokens, {spaces: '\t'});
	}

	// check whether streamer needs a reminder
	async function checkNeedsReminder()
	{
		console.log(`${(new Date()).toTimeString()}: [D] Sleep complete.`);
		for (channel in botChannels)
		{
			const uptimeMinutes = await util.getUptimeInMinutes(twitchClient, channel)
			const uptimeHours = Math.floor(uptimeMinutes / 60);

			console.log(`${(new Date()).toTimeString()}: [D] ${channel}.lastUptimeCheck: ${botChannels[channel].lastUptimeCheck}`);
			console.log(`${(new Date()).toTimeString()}: [D]\t uptimeMinutes: ${uptimeMinutes}`);
			console.log(`${(new Date()).toTimeString()}: [D]\t uptimeHours: ${uptimeHours}`);

			// first off, this if statement is only true if the stream has been up for less than an hour
			// aka when the streamer has been streaming for a very short amount of time or, more importantly, goes offline
			// without this, lastUptimeCheck would never be set back to 0 and that would break everything
			if (uptimeHours === 0)
			{
				botChannels[channel].lastUptimeCheck = 0;
			}

			// when this if statement is true it means another hour of streaming has passed
			// thus, we also set lastUptimeCheck to the calculated uptimeHours
			if (uptimeHours > botChannels[channel].lastUptimeCheck)
			{
				botChannels[channel].lastUptimeCheck = uptimeHours;
				if (botChannels[channel].color)
					{
						chatClient.action(channel, `You've been live for just over ${uptimeHours} hours. By this point in your broadcast, you should have consumed ${baseOz * uptimeHours}oz (${baseMl * uptimeHours}ml) of water to maintain optimal hydration.`);
					}
					else
					{
						chatClient.say(channel, `You've been live for just over ${uptimeHours} hours. By this point in your broadcast, you should have consumed ${baseOz * uptimeHours}oz (${baseMl * uptimeHours}ml) of water to maintain optimal hydration.`);
					}
			}
		}
	await fs.writeJson(channelsFile, botChannels, {spaces: '\t'});
	}

	// main loop; check uptime every 5 minutes
	while (true)
	{
		await util.sleep(5*60).then(result => checkNeedsReminder());
	}
})();
