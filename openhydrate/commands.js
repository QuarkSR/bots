"use strict";
const fs = require('fs-extra');
const util = require('./util.js');

const channelsFile = './channels.json';

function ping(chatClient, channel)
{
	console.log(`${(new Date()).toTimeString()}: [D] Received !ping.`);
	chatClient.say(channel, 'Pong!');
}

async function colour(chatClient, channel)
{
	try
	{
		var allChannels = await fs.readJson(channelsFile);

		allChannels[channel].color = true;

		await fs.writeJson(channelsFile, allChannels, {spaces: '\t'});

		console.log(`${(new Date()).toTimeString()}: [+] Colour set to ${await util.getChannelProperty(channel, 'color')} in ${channel}.`);
		chatClient.say(channel, `Colour set to ${await util.getChannelProperty(channel, 'color')} in ${channel}.`);
	}
	catch (err)
	{
		console.log(`${(new Date()).toTimeString()}: [!] Failed to set colour property of ${channel}.`);
		console.log(`${(new Date()).toTimeString()}: [!]\t Error message: ${err}`);
	}
}

async function nocolour(chatClient, channel)
{
	try
	{
		var allChannels = await fs.readJson(channelsFile);

		allChannels[channel].color = false;

		await fs.writeJson(channelsFile, allChannels, {spaces: '\t'});

		console.log(`${(new Date()).toTimeString()}: [+] Colour set to ${await util.getChannelProperty(channel, 'color')} in ${channel}.`);
		chatClient.say(channel, `Colour set to ${await util.getChannelProperty(channel, 'color')} in ${channel}.`);
	}
	catch (err)
	{
		console.log(`${(new Date()).toTimeString()}: [!] Failed to set colour property of ${channel}.`);
		console.log(`${(new Date()).toTimeString()}: [!]\t Error message: ${err}`);
	}
}

async function hydrate(chatClient, channel, hours)
{
	const baseOz = 4;
	const baseMl = 120;

	console.log(`${(new Date()).toTimeString()}: [D] Received !hydrate.`);

	if (await util.getChannelProperty(channel, 'color'))
	{
		chatClient.action(channel, `You've been live for just over ${hours} hours. By this point in your broadcast, you should have consumed ${baseOz * hours}oz (${baseMl * hours}ml) of water to maintain optimal hydration.`);
	}
	else
	{
		chatClient.say(channel, `You've been live for just over ${hours} hours. By this point in your broadcast, you should have consumed ${baseOz * hours}oz (${baseMl * hours}ml) of water to maintain optimal hydration.`);
	}
}

async function addUser(chatClient, user)
{
	try
	{
		const channel = '#' + user;
		var allChannels = await fs.readJson(channelsFile);

		if (channel in allChannels)
		{
			console.log(`${(new Date()).toTimeString()}: [-] ${channel} already exists in channels.json.`);
			chatClient.say('openhydrate', `${channel} already exists in channels.json.`);
			return;
		}

		const newUserData = {name: user, color: false, lastUptimeCheck: 0}

		allChannels[channel] = newUserData;

		await fs.writeJson(channelsFile, allChannels, {spaces: '\t'})

		console.log(`${(new Date()).toTimeString()}: [+] Successfully added channel ${channel} to channels.json.`);
		chatClient.say('openhydrate', `Successfully added channel ${channel} to channels.json.`);
	}
	catch (err)
	{
		console.log(`${(new Date()).toTimeString()}: [!] Failed to add user to channels.json.`);
		console.log(`${(new Date()).toTimeString()}: [!]\t Error message: ${err}`);
	}
}

async function removeUser(chatClient, user)
{
	try
	{
		const channel = '#' + user;
		var allChannels = await fs.readJson(channelsFile);

		if (!(channel in allChannels))
		{
			console.log(`${(new Date()).toTimeString()}: [-] ${channel} does not exist in channels.json.`);
			chatClient.say('openhydrate', `${channel} does not exist in channels.json.`);
			return;
		}

		delete allChannels[channel]

		await fs.writeJson(channelsFile, allChannels, {spaces: '\t'});

		console.log(`${(new Date()).toTimeString()}: [+] Successfully removed channel ${channel} from channels.json.`);
		chatClient.say('openhydrate', `Successfully removed channel ${channel} from channels.json.`);
	}
	catch (err)
	{
		console.log(`${(new Date()).toTimeString()}: [!] Failed to remove user from channels.json.`);
		console.log(`${(new Date()).toTimeString()}: [!]\t Error message: ${err}`);
	}
}


module.exports =
{
	ping: ping,
	colour: colour,
	nocolour: nocolour,
	hydrate: hydrate,
	addUser: addUser,
	removeUser: removeUser
}
