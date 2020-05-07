const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");
require("dotenv").config();

const bot = new Discord.Client();
bot.login(process.env.TOKEN);


bot.on("message", async msg => {
	if (msg.author.bot) return;

	if (msg.attachments.size > 0 && msg.channel.name.startsWith(process.env.REQ_CHANNEL)) {
		// TODO: add the option to send privately.
		let att = msg.attachments.first();

		if (!att.name.match(".cu?$"))
			return msg.reply("only .c and .cu files are allowed.");

		let queue = msg.channel.name.substring(process.env.REQ_CHANNEL.length);

		const file = fs.createWriteStream(`./programs/${process.env.PROGRAM}`);
		const request = await http.get(att.url, async response => {
			response.pipe(file)
			await msg.delete();
			require(`./commands/test${queue}.js`).run(bot, msg);
		});
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
