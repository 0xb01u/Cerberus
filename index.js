const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");
require("dotenv").config();

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("ready", async () => {
	await bot.user.setPresence({ activity: {name: ``}, status: `online` });
});

bot.on("guildCreate", guild => {
	console.log(`Hermes joined the guild ${guild.name} (${guild.id}).`);

	if (!fs.existsSync(`./guilds`)) fs.mkdirSync(`./guilds`);
	let guildMap = !fs.existsSync(`./guilds/guildMap.json`) ? JSON.parse(`./guilds/guildMap.json`) : {};

	guildMap[guild.name.replace(/ /g, "_")] = guild.id;
	fs.writeSync(`./guilds/guildMap.json`, JSON.stringify(guildMap));
});

bot.on("message", async msg => {
	if (msg.author.bot) return;

	if (msg.channel.type === "dm" && msg.attachments.size > 0) {
		// Download attachement:
		let att = msg.attachments.first();
		let args = msg.content.split(" ");

		let filepath = `./programs/${att.name}`;
		const file = fs.createWriteStream(filepath);
		await http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					delete require.cache[require.resolve(`./commands/test_${""}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_${""}.js`).run(bot, msg, args, att.name);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
				} catch (e) {
					fs.unlinkSync(filepath);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
					msg.reply("there was an error trying to send your program to the queue :(");
				}
			});
		});
	}

	else if (msg.content.startsWith(process.env.PRE)) {
		let args = msg.content.substring(process.env.PRE.length).split(" ");
		// Remove epty elements on args array:
		args = args.filter((e) => e != "");
		let cmd = args.shift().toLowerCase();

		// Retrieve the server ID:
		let serverID = 0;
		if (msg.channel.type === "dm") {
			if (!fs.existsSync(`./guilds/guildMap.json`)) {
				return msg.reply(`sorry, I must join at least one server before executing any commands.`);
			}

			let guildMap = JSON.parse(`./guilds/guildMap.json`);

			let guild_name = args.shift();
			if (guildMap.contains(guild_name)) {
				return msg.reply(
					`I don't know about any server named "${guild_name}, can you check that again?"\n` +
					`(Remember that on direct message channels you must specify the name of the Discord server` +
					`you are refering to as the first argument of any command, replacing any space " " with underscores "_".)`
				);
			}

			serverID = guildMap[guild.name];
		} else {
			serverID = msg.guild.id;
		}

		try {
			delete require.cache[require.resolve(`./commands/${cmd}.js`)];

			require(`./commands/${cmd}.js`).run(bot, msg, args, serverID);

		} catch (e) { 
			if (msg.channel.type === "dm") msg.reply("nonexistent command.");
			console.log(e.stack);
		}
	}
});
