exports.run = async (bot, msg, args) => {
	msg.channel.send(
		"Here's a quick list of publicly available commands:\n" +
		"`!team` to manage teams.\n" +
		"`!config` to see your current default arguments for requests, including your team and password.\n" +
		"`!set` to set your default arguments for requests (you'll probably use this to set your default queue).\n" +
		"Send me a file and I'll try to send it to Tablón!\n" +
		"If you have **any** doubt, ask the bot master directly. They will answer them as soon as they can, so don't be shy! :smile:"
	);
}
