/*
 *  Cerberus - Discord bot for cooperative CUDA executions in parallel
 *  programming courses using gamification techniques
 *  Copyright (C) 2020-2024  Bolu - email: bolu@tuta.io
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");

var env = JSON.parse(fs.readFileSync("env.json"));
for (let key in env) {
	process.env[key] = (env[key] + "").replaceAll("\\ ", " ");
}
delete env;

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("ready", async () => {
	await bot.user.setPresence({ activity: {name: ``}, status: `online` });

	if (!fs.existsSync("./programs")) fs.mkdirSync("./programs");
	if (!fs.existsSync("./tests")) fs.mkdirSync("./tests");
	if (!fs.existsSync("./outputs")) fs.mkdirSync("./outputs");
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
					delete require.cache[require.resolve(`./commands/test_.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_.js`).run(bot, msg, args, queue);
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
		let queue = msg.channel.name.substring(process.env.REQ_CHANNEL.length);	// Currently "unused".

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

					delete require.cache[require.resolve(`./commands/test_.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_.js`).run(bot, msg, args, queue);
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
