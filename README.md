# OpenHydrate
A clone of stay_hydrated_bot, after that bot stopped working. This twitch bot
will remind the streamer to drink water for each hour that they are streaming.
Currently, the chats that this bot will appear in must be changed by manually
editing the variable botChannels in hydrate.js; I'm planning on adding a way
for any streamers to add the bot to their channels in a similar fashion as the
old stay_hydrated_bot did (entering a command in OpenHydrate's chatroom). In
addition, the color variable is global across all chats - this will eventually
be remedied too (potentially by changing botChannels to an array of structs,
each struct having a property called color).
