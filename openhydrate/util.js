async function isStreamLive(twitchClient, username)
{
	var user = await twitchClient.helix.users.getUserByName(username);
	if (!user)
	{
		return false;
	}
	return await user.getStream() !== null;
}

exports.getUptimeInMinutes = async function(twitchClient, username)
{
	live = await isStreamLive(twitchClient, username)
	if (!live)
	{
		return 0;
	}

	var user = await twitchClient.helix.users.getUserByName(username);
	var data = await user.getStream();

	var start = data.startDate;
	var now = new Date().toISOString();

	var diff = new Date(Date.parse(now) - Date.parse(start));
	var uptime = (60 * (diff.getHours() - 1)) + diff.getMinutes()

	return uptime;
}

exports.checkLastSendTime = function(lastMsgTime)
{
	now = new Date();
	diff = Date.parse(now) - Date.parse(lastMsgTime);
	diffMs = new Date(diff).getTime();
	diffMins = Math.floor(diffMs / 1000 / 60);

	return diffMins;
}
