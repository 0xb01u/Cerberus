const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");
require("dotenv").config();

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("ready", async () => {
	bot.user.setPresence({ activity: {name: ``}, status: `online` });
	bot.user.setAvatar("./images/hermes.png");
	// Cerberus image taken from: https://imgbin.com/png/XKxfm3Sc/hades-dog-cerberus-greek-mythology-graphics-png
	// Hermes image taken from: https://www.theoi.com/Gallery/M12.5.html
});

/**
 * When the bot joins a new server, it adds it to its server list,
 * and adds all the non-administrator users as students for the server.
 */
bot.on("guildCreate", guild => {
	console.log(`Hermes joined the guild ${guild.name} (${guild.id}).`);

	if (!fs.existsSync(`./guilds`)) fs.mkdirSync(`./guilds`);
	let guildMap = !fs.existsSync(`./guilds/guildMap.json`) ? JSON.parse(`./guilds/guildMap.json`) : {};

	let guildName = guild.name.replace(/ /g, "_");
	guildMap[guildName] = guild.id;
	fs.writeSync(`./guilds/guildMap.json`, JSON.stringify(guildMap));

	const Student = require("./objects/Student.js");

	for (let member of guild.members) {
		if (!member.hasPermission("ADMINISTRATOR")) {
			if (!fs.existsSync(`./users/${member.id}.json`)) {
				let student = new Student(member.id, guildName, member.name, member.user.username, member.user.discriminator);
			} else {
				global.getStudent(member.id).addServer(guildName);
			}
		}
	}
});

/**
 * When a new user joins a server the bot is in, it adds them as students
 * for the server.
 */
bot.on("guildMemberAdd", member => {
	let guildMap = JSON.parse(`./guilds/guildMap.json`);

	if (!fs.existsSync()`./users/${member.id}.json`) {
		let student = new Student(member.id, guildMap[member.guild.id], member.name, member.user.username, member.user.discriminator);		
	} else {
		global.getStudent(member.id).addServer(guildName);
	}
});

/**
 * Message and command handling.
 */
bot.on("message", async msg => {
	if (msg.author.bot) return;

	userLevel = (msg.member.hasPermission("ADMINISTRATOR")) ? "administrator" : "";

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
					delete require.cache[require.resolve(`./commands/${userLevel}/test_${""}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/${userLevel}/test_${""}.js`).run(bot, msg, args, att.name);
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
		let serverID = -1;

		if (cmd === "set") { /* Do nothing with the server ID */ }
		else if (msg.channel.type === "dm") {
			if (!fs.existsSync(`./guilds/guildMap.json`)) {
				return msg.reply(`sorry, I must join at least one server before executing any commands.`);
			}

			let guildMap = JSON.parse(`./guilds/guildMap.json`);

			let guildName = args.shift();
			if (!(guildName in guildMap)) {
				return msg.reply(
					`I don't know about any server named "${guildName}, can you check that again?"\n` +
					`(Remember that on direct message channels you must specify the name of the Discord server` +
					`you are refering to as the first argument of any command, replacing any space " " with underscores "_".)`
				);
			}

			serverID = guildMap[guild.name];
		} else {
			serverID = msg.guild.id;
		}

		try {
			delete require.cache[require.resolve(`./commands/${userLevel}/${cmd}.js`)];

			require(`./commands/${userLevel}/${cmd}.js`).run(bot, msg, args, serverID);

		} catch (e) { 
			if (msg.channel.type === "dm") msg.reply("nonexistent command.");
			console.log(e.stack);
		}
	}
});

/**
 * Retrieves a guild ID given its name.
 */
global.getServer = function getServer(serverName) {
	if (!fs.existsSync(`./guilds/guildMap.json`)) {
		// TODO: handle this exception.
		return null;
	}

	let guildMap = JSON.parse(`./guilds/guildMap.json`);
	if (!(serverName in guildMap)) {
		// TODO: handle this exception.
		return null;
	}

	return guildMap[serverName];
}

/**
 * Retrieves an user object given the user's ID.
 */
global.getStudent = function getStudent(userID) {
	if (!fs.existsSync(`./users/${userID}.json`)) {
		// TODO: handle this exception.
		return null;
	}

	const User = require("./objects/Student.js");
	return User.fromJSON(JSON.parse(`./users/${userID}.json`));
}

/**
 * Retrieves a Team given its ID.
 */
global.getTeam = function getTeam(teamID, guildID) {
	if (!fs.existsSync(`./teams/${guildID}/${teamID}.json`)) {
		// TODO: handle this exception..
		return null;
	}

	const Team = require("./objects/Team.js");
	return Team.fromJSON(JSON.parse(`./teams/${guildID}/${teamID}.json`));
}
