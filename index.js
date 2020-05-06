const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");
require("dotenv").config();

const bot = new Discord.Client();
bot.login(process.env.TOKEN);


bot.on("message", msg => {
	if (msg.author.bot) return;

	if (msg.attachments.size > 0 && msg.channel.name.startsWith(process.env.REQ_CHANNEL)) {
		// TODO: add the option to send privately.
		let url = msg.attachments.first().url;
		msg.delete();
		let queue = msg.channel.name.substring(process.env.REQ_CHANNEL);

		const file = fs.createWriteStream(`./programs/${process.env.PROGRAM}`);
		const request = http.get(url, response => response.pipe(file));
		require(`./commands/test${queue}.js`).run(bot, msg);
	}

	else if (msg.content.startsWith(process.env.PRE)) {
		let args = msg.content.substring(process.env.PRE.length).split(" ");
		let cmd = args.shift().toLowerCase();

		try {
			delete require.cache[require.resolve(`./commands/${cmd}.js`)];

			let commandFile = require(`./commands/${cmd}.js`);
			commandFile.run(bot, msg, args);

		} catch (e) { console.log(e.stack); }
	}
});
