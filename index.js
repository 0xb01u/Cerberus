const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");

var env = JSON.parse(fs.readFileSync("env.json"));
process.env["TOKEN"] = env.TOKEN;
process.env["PRE"] = env.PRE;
process.env["TEAM_CAPACITY"] = env.TEAM_CAPACITY;
process.env["TEAM_PRE"] = env.TEAM_PRE;

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("ready", async () => {
	// TODO: create directories here.
	bot.user.setPresence({ activity: {name: ``}, status: `online` });
	//bot.user.setAvatar("./images/hermes.png");
	// Cerberus image taken from: https://imgbin.com/png/XKxfm3Sc/hades-dog-cerberus-greek-mythology-graphics-png
	// Hermes image taken from: https://www.theoi.com/Gallery/M12.5.html

	if (!fs.existsSync(`./guilds`)) fs.mkdirSync(`./guilds`);
	let guildMap = fs.existsSync(`./guilds/guildMap.json`) ? JSON.parse(fs.readFileSync(`./guilds/guildMap.json`)) : {};

	// Rename to "Hermes":
	for (let guild of bot.guilds.cache.array()) {
		console.log(`Hermes entered the guild ${guild.name} (${guild.id}).`);

		// (await guild.members.fetch(bot.user.id)).setNickname("Hermes");

		if (!(guild.id in guildMap)) {
			let guildName = guild.name.replace(/ /g, "_");
			guildMap[guildName] = guild.id;
			fs.writeFileSync(`./guilds/guildMap.json`, JSON.stringify(guildMap));

			const Student = require("./objects/Student.js");

			// IMPORTANT: Intents (GUILD_MEMBERS)
			for (let member of (await guild.members.fetch()).array()) {
				if (!member.user.bot) {
					if (!fs.existsSync(`./users/${member.id}.json`)) {
						let student = new Student(member.id, guildName, member.user.username, member.user.discriminator);
					} else {
						global.getStudent(member.id).addServer(guildName);
					}
				}
			}
		}
	}
});

/**
 * When the bot joins a new server, it adds it to its server list,
 * and adds all the non-administrator users as students for the server.
 */
bot.on("guildCreate", async guild => {
	console.log(`Hermes joined the guild ${guild.name} (${guild.id}).`);

	//(await guild.members.fetch(bot.user.id)).setNickname("Hermes");

	if (!fs.existsSync(`./guilds`)) fs.mkdirSync(`./guilds`);
	let guildMap = !fs.existsSync(`./guilds/guildMap.json`) ? JSON.parse(fs.readFileSync(`./guilds/guildMap.json`)) : {};

	let guildName = guild.name.replace(/ /g, "_");
	guildMap[guildName] = guild.id;
	fs.writeFileSync(`./guilds/guildMap.json`, JSON.stringify(guildMap));

	const Student = require("./objects/Student.js");

	for (let member of (await guild.members.fetch()).array()) {
		if (!member.user.bot) {
			if (!fs.existsSync(`./users/${member.id}.json`)) {
				let student = new Student(member.id, guildName, member.user.username, member.user.discriminator);
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
	let guildMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));

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

	let userLevel = "";

	/*
	 * Sending a program to the queue.
	 */
	if (msg.channel.type === "dm" && msg.attachments.size == 1) {
		// Download attachement:
		let att = msg.attachments.first();
		let args = msg.content.split(" ");

		if (!fs.existsSync(`./programs/`)) fs.mkdirSync(`./programs`);

		let filepath = `./programs/${att.name}`;
		const file = fs.createWriteStream(filepath);
		await http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					delete require.cache[require.resolve(`./commands/${userLevel}test_${""}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/${userLevel}test_${""}.js`).run(bot, msg, args, att.name);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
				} catch (e) {
					fs.unlinkSync(filepath);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
					msg.reply("there was an error trying to send your program to the queue :(");
					console.log(e.stack);
				}
			});
		});
	}

	/*
	 * Sending a team-password file to update the teams.
	 */
	else if ((msg.channel.type !== "dm" && msg.member.hasPermission("ADMINISTRATOR"))
		&& msg.attachments.size == 1 && msg.attachments.first().name.match(/\.teams$/)) {

		if (msg.channel.name !== "bot") msg.delete({ timeout: 0 });

		let att = msg.attachments.first();

		/*
		 * Fetch the file and process it.
		 */
		http.get(att.url).on("response", async response => {
			response.setEncoding("utf8");
			let body = "";	// Text file.

			response.on("data", chunk => {
				body += chunk;
			});

			response.on("end", () => {
				let passwds = body.split("\n");

				for (let line of passwds) {
					let teamID = line.split(" ")[0];
					let passwd = line.split(" ")[1];

					global.getTeam(teamID, msg.guild.id).setPassword(passwd);
				}
				msg.reply("the passwords for the teams have been updated succesfully!");
			});

			response.on("error", e => {
				msg.reply("there was an error trying to update the passwords for the teams >:(");
			});
		});
	}

	/*
	 * Usage of a regular command.
	 */
	else if (msg.content.startsWith(process.env.PRE)) {
		let args = msg.content.substring(process.env.PRE.length).split(" ");
		// Remove empty elements on args array:
		args = args.filter((e) => e != "");
		let cmd = args.shift().toLowerCase();

		// Retrieve the server ID:
		let serverID = -1;

		if (msg.channel.type === "dm") {
			// TODO: admins outside guilds.
			userLevel = false // || msg.member.hasPermission("ADMINISTRATOR"))
				? "administrator/" : "";

			if (!fs.existsSync(`./guilds/guildMap.json`)) {
				return msg.reply(`sorry, I must join at least one server before executing any commands.`);
			}

			let guildMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));

			let guildName = args[0];
			if (guildName in guildMap) {
				serverID = guildMap[args.shift()];
			}
		} else {
			serverID = msg.guild.id;
		}

		try {
			delete require.cache[require.resolve(`./commands/${userLevel}${cmd}.js`)];

			require(`./commands/${userLevel}${cmd}.js`).run(bot, msg, args, serverID);

		} catch (e) { 
			if (msg.channel.type === "dm") msg.reply("nonexistent command.");
			//console.log(e.stack);
		}
	}
});

/**
 * Retrieves a guild ID given its name.
 */
global.getServer = function getServer(serverName) {
	if (!fs.existsSync(`./guilds/guildMap.json`)) {
		// Exception.
		return null;
	}

	let guildMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));
	if (!(serverName in guildMap)) {
		// Exception.
		return null;
	}

	return guildMap[serverName];
}

/**
 * Retrieves an user object given the user's ID.
 */
global.getStudent = function getStudent(userID) {
	if (!fs.existsSync(`./users/${userID}.json`)) {
		// Exception.
		return null;
	}

	const User = require("./objects/Student.js");
	return User.fromJSON(JSON.parse(fs.readFileSync(`./users/${userID}.json`)));
}

/**
 * Retrieves a Team given its ID.
 */
global.getTeam = function getTeam(teamID, guildID) {
	if (!fs.existsSync(`./teams/${guildID}/${teamID}.json`)) {
		// Exception.
		return null;
	}

	const Team = require("./objects/Team.js");
	return Team.fromJSON(JSON.parse(fs.readFileSync(`./teams/${guildID}/${teamID}.json`)));
}
