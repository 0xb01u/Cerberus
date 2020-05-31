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
		let queue = args.shift().toLowerCase();

		let filepath = `./programs/${process.env.PROGRAM}`;
		if (queue === "cuda") {
			if (!att.name.match(".tgz$")) {
				return msg.reply("only .tgz files are allowed.");
			}
			filepath += `.tgz`;
		}
		else if (!att.name.match(".c$")) {
			return msg.reply("only .c files are allowed (or .cu if sent to cuda).");
		}

		const file = fs.createWriteStream(filepath);
		await http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					delete require.cache[require.resolve(`./commands/test_${queue}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_${queue}.js`).run(bot, msg, args);
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
		// TODO: add the option to send privately.
		let att = msg.attachments.first();
		let args = msg.content.split(" ");
		let queue = msg.channel.name.substring(process.env.REQ_CHANNEL.length + process.env.SEPARATOR.length);

		let filepath = `./programs/${process.env.PROGRAM}`;

		if (queue === "cuda") {
			if (!att.name.match(".tgz$")) {
				await msg.delete();
				return msg.reply("only .tgz files are allowed.");
			}
			filepath += `.tgz`;
		}
		else if (!att.name.match(".c$")) {
			await msg.delete();
			return msg.reply("only .c files are allowed.");
		}


		const file = fs.createWriteStream(filepath);
		await http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					await msg.delete();

					delete require.cache[require.resolve(`./commands/test_${queue}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_${queue}.js`).run(bot, msg, args);
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
