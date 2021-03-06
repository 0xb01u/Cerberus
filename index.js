const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");
require("dotenv").config();

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("ready", async () => {
	await bot.user.setPresence({ activity: {name: ``}, status: `online` });
});

bot.on("message", async msg => {
	if (msg.author.bot) return;

	if (msg.channel.type === "dm" && msg.attachments.size > 0) {
		let att = msg.attachments.first();
		let args = msg.content.split(" ");
		let queue = args.shift().toLowerCase();	// Currently "unused".

		let filepath = `./programs/${process.env.PROGRAM}`;
		if (!att.name.match(".tgz$")) {
			return msg.reply("only .tgz files are allowed.");
		}
		filepath += `.tgz`;

		const file = fs.createWriteStream(filepath);
		await http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					delete require.cache[require.resolve(`./commands/test_${}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_${}.js`).run(bot, msg, args, queue);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
				} catch (e) {
					fs.unlinkSync(filepath);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
					msg.reply("invalid queue.");
				}
			});
		});
	}

	else if (msg.channel.name.startsWith(process.env.REQ_CHANNEL) && msg.attachments.size > 0) {
		let att = msg.attachments.first();
		let args = msg.content.split(" ");
		let queue = msg.channel.name.substring(process.env.REQ_CHANNEL.length + process.env.SEPARATOR.length);	// Currently "unused".

		let filepath = `./programs/${process.env.PROGRAM}`;

		if (!att.name.match(".tgz$")) {
			await msg.delete();
			return msg.reply("only .tgz files are allowed.");
		}
		filepath += `.tgz`;


		const file = fs.createWriteStream(filepath);
		await http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					await msg.delete();

					delete require.cache[require.resolve(`./commands/test_${}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_${}.js`).run(bot, msg, args, queue);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
				} catch (e) {
					console.log(e.stack);
					fs.unlinkSync(filepath);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
					msg.reply("invalid queue.");
				}
			});
		});
	}

	else if (msg.content.startsWith(process.env.PRE)) {
		let args = msg.content.substring(process.env.PRE.length).split(" ");
		// Remove epty elements on args array:
		args = args.filter((e) => e != "");
		let cmd = args.shift().toLowerCase();

		try {
			delete require.cache[require.resolve(`./commands/${cmd}.js`)];

			require(`./commands/${cmd}.js`).run(bot, msg, args);

		} catch (e) { 
			msg.reply("nonexistent command.");
			console.log(e.stack);
		}
	}
});
