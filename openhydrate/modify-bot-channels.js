const fs = require('fs-extra');

const channelsFile = './channels.json';

(async() =>
{
	var channelData = await fs.readJson(channelsFile);

	exports.addUser = async function(chatClient, channel)
	{
		if (channel in channelData)
		{
			console.log(`${(new Date()).toTimeString()}: [-] ${channel} already exists in channels.json.`);
			chatClient.say('openhydrate', `${channel} already exists in channels.json.`);
			return;
		}

		const userData =
		{
			name: channel.slice(1),
			color: false,
			lastUptimeCheck: 0
		}

		channelData[channel] = userData;
		await fs.writeJson(channelsFile, channelData, {spaces: '\t'})
			.then(result =>
			{
				console.log(`${(new Date()).toTimeString()}: [+] Successfully added channel ${channel} to channels.json.`);
				chatClient.say('openhydrate', `Successfully added channel ${channel} to channels.json.`);
			});
	}

	exports.removeUser = async function(chatClient, channel)
	{
		if (!(channel in channelData))
		{
			console.log(`${(new Date()).toTimeString()}: [-] ${channel} does not exist in channels.json.`);
			chatClient.say('openhydrate', `${channel} does not exist in channels.json.`);
			return;
		}
		delete channelData[channel];
		await fs.writeJson(channelsFile, channelData, {spaces: '\t'})
			.then(result =>
			{
				console.log(`${(new Date()).toTimeString()}: [+] Successfully removed channel ${channel} from channels.json.`);
				chatClient.say('openhydrate', `Successfully removed channel ${channel} from channels.json.`);
			});
	}

})();
