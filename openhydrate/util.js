async function isStreamLive(twitchClient, channel)
{
	var user = await twitchClient.helix.users.getUserByName(channel.slice(1));
	if (!user)
	{
		return false;
	}
	return await user.getStream() !== null;
}

exports.getUptimeInMinutes = async function(twitchClient, channel)
{
	live = await isStreamLive(twitchClient, channel)
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

exports.sleep = function(s)
{
	return new Promise(resolve => setTimeout(resolve, s*1000));
}
