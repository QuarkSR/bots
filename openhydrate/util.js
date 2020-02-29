"use strict";
const fs = require('fs-extra');

async function isStreamLive(twitchClient, channel)
{
	var user = await twitchClient.helix.users.getUserByName(channel.slice(1));
	if (!user)
	{
		return false;
	}
	return await user.getStream() !== null;
}

function sleep(s)
{
	return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function getChannelProperty(channel, prop)
{
	try
	{
		const channelsFile = './channels.json';
		const allChannels = await fs.readJson(channelsFile);
		//console.log(channel);

		const channelProps = allChannels[channel];
		return channelProps[prop];
	}
	catch (err)
	{
		console.log(`${(new Date()).toTimeString()}: [!] Failed to read channels.json`);
		console.log(`${(new Date()).toTimeString()}: [!]\t Error message: ${err}`);
	}
}

async function getUptimeInMinutes(twitchClient, channel)
{
	const live = await isStreamLive(twitchClient, channel)
	if (!live)
	{
		return 0;
	}

	var user = await twitchClient.helix.users.getUserByName(channel.slice(1));
	var data = await user.getStream();

	var start = data.startDate;
	var now = new Date().toISOString();

	var diff = new Date(Date.parse(now) - Date.parse(start));
	var uptime = (60 * (diff.getHours() - 1)) + diff.getMinutes()

	return uptime;
}

async function getUptimeInHours(twitchClient, channel)
{
		return Math.floor((await getUptimeInMinutes(twitchClient, channel)) / 60)
}

async function needsReminder(twitchClient, channel, lastUptimeCheck)
{
	const hours = await getUptimeInHours(twitchClient, channel);
	const minutesPast = (await getUptimeInMinutes(twitchClient, channel)) % 60;

	if ((minutesPast <= 5) && (hours > lastUptimeCheck))
	{
		return true;
	}
	return false;
}

module.exports =
{
	sleep: sleep,
	getChannelProperty: getChannelProperty,
	getUptimeInMinutes: getUptimeInMinutes,
	getUptimeInHours: getUptimeInHours,
	needsReminder: needsReminder
}
