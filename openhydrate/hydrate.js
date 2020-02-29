"use strict";
// imports
const TwitchClient = require('twitch').default;
const ChatClient = require('twitch-chat-client').default;
const fs = require('fs-extra');

const util = require('./util.js');
const commands = require('./commands.js');

const tokensFile = './tokens.json';
const channelsFile = './channels.json';

// wrapped in async to allow for awaits
(async() =>
{
	// constant / variable declarations
	var botChannels = await fs.readJson(channelsFile);
	const tokenData = await fs.readJson(tokensFile);
	const twitchClient = await TwitchClient.withCredentials(tokenData.clientId, tokenData.accessToken, undefined,
								{
									clientSecret: tokenData.clientSecret,
									expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
									refreshToken: tokenData.refreshToken,
									onRefresh: (async function() { await fs.writeJson(tokensFile, tokenData, {spaces: '\t'}) })
									//onRefresh: await writeNewData(tokenData)
								});
	const chatClient = await ChatClient.forTwitchClient(twitchClient, {channels: Object.keys(botChannels)});

	await chatClient.connect();
	console.log(`${(new Date()).toTimeString()}: [+] Connected.`);
	console.log(`${(new Date()).toTimeString()}: [+] In channels: ${Object.keys(botChannels)}`);

	// setup privmsg listener
	chatClient.onPrivmsg((channel, user, message) =>
	{
		if (message.startsWith('!ping'))
		{
			commands.ping(chatClient, channel);
		}
		if (message.startsWith('!color') || message.startsWith('!colour'))
		{
			commands.colour(chatClient, channel);
		}
		if (message.startsWith('!nocolor') || message.startsWith('!nocolour'))
		{
			commands.nocolour(chatClient, channel);
		}
		if (message.startsWith('!hydrate'))
		{
			(async() =>
			{
				var hours = await util.getUptimeInHours(twitchClient, channel);
				commands.hydrate(chatClient, channel, hours);
			})();
		}
		if (message.startsWith('!addbot') && channel === '#openhydrate')
		{
			commands.addUser(chatClient, user);
		}
		if (message.startsWith('!removebot') && channel === '#openhydrate')
		{
			commands.removeUser(chatClient, user);
		}
	});

	// main loop; check uptime every 5 minutes
	while (true)
	{
		try
		{
			await util.sleep(5*60);
			console.log(`${(new Date()).toTimeString()}: [D] Checking uptimes.`)
			botChannels = await fs.readJson(channelsFile);
			for (var channel in botChannels)
			{
				console.log(`${(new Date()).toTimeString()}: [D]\t Checking ${channel}.`);
				if (await util.getUptimeInHours(twitchClient, channel) === 0)
				{
					if (await util.getUptimeInMinutes(twitchClient, channel) === 0)
					{
						console.log(`${(new Date()).toTimeString()}: [D]\t\t Channel offline.`);
					}
					else
					{
						console.log(`${(new Date()).toTimeString()}: [D]\t\t Channel uptime < 1 hour.`);
					}
					botChannels[channel].lastUptimeCheck = 0;
					await fs.writeJson(channelsFile, botChannels, {spaces: '\t'});
				}

				else if (await util.needsReminder(twitchClient, channel, botChannels[channel].lastUptimeCheck))
				{
					console.log(`${(new Date()).toTimeString()}: [D]\t\t Channel needs a reminder.`);
					commands.hydrate(chatClient, channel, await util.getUptimeInHours(twitchClient, channel));
					botChannels[channel].lastUptimeCheck = await util.getUptimeInHours(twitchClient, channel);
					await fs.writeJson(channelsFile, botChannels, {spaces: '\t'});
				}
				else
				{
					console.log(`${(new Date()).toTimeString()}: [D]\t\t Channel does not need a reminder.`);
				}
			}
		}
		catch (err)
		{
			console.log(`${(new Date()).toTimeString()}: [!] Failed to execute main loop.`);
			console.log(`${(new Date()).toTimeString()}: [!]\t Error message: ${err}`);
		}
	}
})();
