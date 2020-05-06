const Discord = require("discord.js");
require("dotenv").config();

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("message", msg => {
	if (msg.author.bot) return;

	if (msg.attachments.size > 0 && (msg.channel.type === "dm" || msg.channel.name === process.env.REQ_CHANNEL))
		require("./commands/test.js").run(bot, msg);

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
