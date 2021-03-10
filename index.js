const Discord = require("discord.js");
const http = require("https");
const fs = require("fs");

var env = JSON.parse(fs.readFileSync("env.json"));
for (let key in env) {
	process.env[key] = env[key];
}
delete env;

const bot = new Discord.Client();
bot.login(process.env.TOKEN);

bot.on("ready", async () => {
	if (!fs.existsSync(`./guilds`)) fs.mkdirSync(`./guilds`);
	let guildMap = fs.existsSync(`./guilds/guildMap.json`) ?
		JSON.parse(fs.readFileSync(`./guilds/guildMap.json`)) :
		{};

	if (!fs.existsSync(`./users`)) fs.mkdirSync(`./users`);
	let userMap = fs.existsSync(`./users/userMap.json`) ?
		JSON.parse(fs.readFileSync(`./users/userMap.json`)) :
		{};

	if (!fs.existsSync(`./teams`)) fs.mkdirSync(`./teams`);

	bot.user.setPresence({ activity: {name: ``}, status: `online` });
	//bot.user.setAvatar("./images/hermes.png");
	// Cerberus image taken from: https://imgbin.com/png/XKxfm3Sc/hades-dog-cerberus-greek-mythology-graphics-png
	// Hermes image taken from: https://www.theoi.com/Gallery/M12.5.html

	for (let guild of bot.guilds.cache.array()) {
		console.log(`Hermes entered the guild ${guild.name} (${guild.id}).`);

		if (!fs.existsSync(`./guilds/${guild.id}`)) fs.mkdirSync(`./guilds/${guild.id}`);

		if (!fs.existsSync(`./teams/${guild.id}/nameMap.json`))
			fs.writeFileSync(`./teams/${guild.id}/nameMap.json`, "{}");

		// Rename to "Hermes":
		// (await guild.members.fetch(bot.user.id)).setNickname("Hermes");

		// New channel found: add to database.
		if (!(guild.id in guildMap)) {
			let guildName = guild.name.replace(/ /g, "_");
			guildMap[guildName] = guild.id;
			fs.writeFileSync(`./guilds/guildMap.json`, JSON.stringify(guildMap, null, 2));

			/*
			 * Create or update the student's objects on the database.
			 */
			const Student = require("./objects/Student.js");
			// IMPORTANT: Intents (GUILD_MEMBERS)
			for (let member of (await guild.members.fetch()).array()) {
				if (!member.user.bot) {
					if (!fs.existsSync(`./users/${member.id}.json`)) {
						let student = new Student(member.id, guildName, member.user.username, member.user.discriminator);
					} else {
						global.getStudent(member.id).addServer(guildName);
					}

					if (!(member.id in userMap)) {
						userMap[member.id] = `${member.user.username}#${member.user.discriminator}`;
					}
				}
			}
		}

		fs.writeFileSync(`./users/userMap.json`, JSON.stringify(userMap, null, 2));

		/*
		 * Fetch messages on the leaderboard channels:
		 */
		for (let ch of guild.channels.cache.array()) {
			if (ch.name === process.env.LB_CHANNEL) {
				ch.messages.fetch({ limit: 20 });
				break;
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
	let guildMap = fs.existsSync(`./guilds/guildMap.json`) ?
		JSON.parse(fs.readFileSync(`./guilds/guildMap.json`)) :
		{};

	let guildName = guild.name.replace(/ /g, "_");
	guildMap[guildName] = guild.id;
	fs.writeFileSync(`./guilds/guildMap.json`, JSON.stringify(guildMap, null, 2));

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

	if (!fs.existsSync(`./users/${member.id}.json`)) {
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
		http.get(att.url, async response => {
			let download = response.pipe(file);
			download.on("finish", async () => {
				try {
					delete require.cache[require.resolve(`./commands/test_${""}.js`)];

					await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });
					await require(`./commands/test_${""}.js`).run(bot, msg, args, att.name);
					await bot.user.setPresence({ activity: {name: ``}, status: `online` });
				} catch (e) {
					if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
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
		&& msg.attachments.size == 1 &&
			(msg.attachments.first().name.match(/\.(teams|pass|passwords?)$/))) {

		if (msg.channel.name !== process.env.BOT_CHANNEL) {
			//return msg.delete({ timeout: 0 });
			msg.channel.send("This is not the correct channel to send that!");
		}

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

		if (cmd === "test_") {
			return msg.reply(
				"Congratulations! You've stumbled into an `ìf` block " +
				"that is there to keep the bot from crashing. Auch! " +
				"You could have caused so much harm :(\n" +
				"I wonder how many people will find this message..."
			);
		}

		// Retrieve the server ID:
		let serverID = null;

		if (msg.channel.type === "dm") { // TODO: admins outside guilds.
			if (!fs.existsSync(`./guilds/guildMap.json`)) {
				return msg.reply(`sorry, I must join at least one server before executing any commands.`);
			}

			let guildName = args[0];
			if (guildName in guildMap) {
				let student = global.getStudent(msg.user.id);
				serverID = student.aliases[args.shift()];
			}
		} else {
			serverID = msg.guild.id;
		}

		try {
			/* Execute the JavaScript file with same name as the specified command. */

			// First update the command's file:
			delete require.cache[require.resolve(`./commands/${cmd}.js`)];
			// Then execute:
			require(`./commands/${cmd}.js`).run(bot, msg, args, serverID);

		} catch (e) {
			// If the command couldn't be executed.
			if (msg.channel.type === "dm") msg.reply("nonexistent command.");
			console.log(e.stack);
		}
	}
});

bot.on("messageReactionAdd", async (reaction, user) => {
	// Filter reactions that are not requests to refresh a table:
	if (user.bot) return;
	if (reaction.emoji.name !== "🔄") return;
	if (reaction.message.author.id !== bot.user.id) return;
	if (reaction.message.embeds.length === 0) return;

	if (reaction.message.channel.type === "dm") {
		refreshRequest(reaction, user);
	}
	else {
		refreshLeaderboard(reaction, user);
	}
});

bot.on("messageReactionRemove", async (reaction, user) => {
	// Filter reactions that are not requests to refresh a table:
	if (user.bot) return;
	if (reaction.emoji.name !== "🔄") return;
	if (reaction.message.author.id !== bot.user.id) return;
	if (reaction.message.embeds.length === 0) return;

	if (reaction.message.channel.type === "dm") {
		refreshRequest(reaction, user);
	}
	else {
		refreshLeaderboard(reaction, user);
	}
});

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
//bot.on("debug", (e) => console.info(e));

async function refreshRequest(reaction, user) {
	let channel = reaction.message.channel;

	channel.startTyping();

	let msg = reaction.message;
	let src = reaction.message.embeds[0];
	let footer = src.footer.text.split("#");
	let serverName = footer[0];
	let rid = footer[1];

	const Request = require("./objects/Request.js");
	let req = Request.fromJSON(JSON.parse(fs.readFileSync(`./guilds/${global.getServer(serverName)}/${rid}.json`)));
	let table = await req.refresh();
	// If the refresh request wasn't processed, return.
	if (!table) return channel.stopTyping();

	// Edit the message:
	let embed = req.toEmbed();
	if (req.output !== "") {
		reaction.message.edit(req.output, embed);
	} else {
		reaction.message.edit(embed);
	}
	channel.stopTyping();
}

async function refreshLeaderboard(reaction, user) {
	if (reaction.message.channel.name !== process.env.LB_CHANNEL) return;

	let server = reaction.message.guild;
	let channel = reaction.message.channel;

	channel.startTyping();

	let msg = reaction.message;
	let src = reaction.message.embeds[0];
	let name = src.footer.text;

	const Leaderboard = require("./objects/Leaderboard.js");
	let lb = Leaderboard.fromJSON(JSON.parse(fs.readFileSync(`./guilds/${server.id}/${name}.json`)));

	if (lb.table == null) return channel.stopTyping();

	let prevTop = lb.table.filter(entry => !entry.Program.startsWith("Ref")).slice(0, process.env.LEADERS)
		.map(entry => entry.User);

	let table = await lb.refresh();
	// If the refresh request wasn't processed, return.
	if (!table) return channel.stopTyping();



	/* Position updates */
	console.log(process.env, process.env.NOTIFY_LEADERS);
	if (process.env.NOTIFY_LEADERS == "true") {

		let top = lb.table.filter(entry => !entry.Program.startsWith("Ref")).slice(0, process.env.LEADERS)
			.map(entry => entry.User);

		// Fetch news channel:
		let newsCh;
		for (let ch of msg.guild.channels.cache.array()) {
			if (ch.name === process.env.BOT_NEWS) {
				newsCh = ch;
				break;
			}
		}

		// Firsts entering the leaderboard:
		if (prevTop.length == 0) {
			if (top.length > 0) {
				let congratz;
				if (top.length > 1) {
					congratz = `Congratulations on being the first teams on the leaderboard ${lb.name}! ` +
						`:partying_face: :confetti_ball: `
					for (let tm of top) {
						let team = global.getTeam(tm, server.id);
						congratz += `${team.id} + ( `;
						for (let member of tm.members) {
							congratz += `<@${member}> `;
						}
						congratz += ") ";
					}

				} else {
					let team = global.getTeam(top[0], server.id);
					congratz = `Congratulations on being the first team on the leaderboard ${lb.name}, ` +
						`${team.id}! :partying_face:`;
					for (let member of team.members) {
						congratz += ` <@${member}>`;
					}
				}
				newsCh.send(congratz);
			}
		}

		// New #1!
		if (prevTop[0] !== top[0]) {
			let n1 = top[0];
			let old1 = prevTop[0];

			notifyTeamPrivately(old1, server.id,
				`The team ${n1} has claimed position #1 on ${lb.name}! :grimacing:`
			);

			notifyTeamPublicly(n1, server.id,
				`Congratulations to ${n1} for becoming #1 on ${lb.name}! :hash::one:\n` +
				`For how long can you hold that position? :thinking:`
			);
		// Any other change in top:
		} else {
			let noTop = [];
			let displaced = [];
			let displacers = [];
			let newTop = [];
			for (let topTeam of top) {
				if (!(prevTop.includes(topTeam))) {
					newTop.push(topTeam);
				} else if (top.indexOf(topTeam) < prevTop.indexOf(topTeam)) {
					displacers.push(topTeam);
				} else if (top.indexOf(topTeam) > prevTop.indexOf(topTeam)) {
					displaced.push(topTeam);
				}
			}
			for (let topTeam of prevTop) {
				if (!(top.includes(topTeam))) {
					noTop.push(topTeam);
				}
			}

			// Notifications:
			for (let newTeam of newTop) {
				notifyTeamPublicly(newTeam, server.id,
					`We have a new team on the top${process.env.LEADERS} of ${lb.name}! Congratulations!`
				);
			}
			for (let better of displacers) {
				notifyTeamPublicly(better, server.id,
					`A team has improved their position on the top${process.env.LEADERS} of ${lb.name}! Congrats!`
				);
			}
			for (let worse of displaced) {
				notifyTeamPrivately(worse, server.id,
					`You've been displaced to a lower top${process.env.LEADERS} position on ${lb.name}! :scream:`
				);
			}
			for (let noMore of noTop) {
				let despacito = await notifyTeamPrivately(noMore, server.id,
					`Oh no! Someone has got a better position than you on ${lb.name}, and you are no longer ` +
					`part of the top${process.env.LEADERS}. :cry:`
				);
				for (let m of despacito) {
					m.react("🇩");
					m.react("🇪");
					m.react("🇸");
					m.react("🇵");
					m.react("🇦");
					m.react("🇨");
					m.react("🇮");
					m.react("🇹");
					m.react("🇴");
				}
			}
		}
	}



	/* Leaderboard (embeds) update*/
	// Get all the multiple messages forming the leaderboard:
	let lbMsgs = channel.messages.cache.array()
		.filter(msg => msg.embeds.length > 0 && msg.embeds[0].footer.text === name)
		.sort(msg => { return msg.createdAt });
	// Get the desired column for the leaderboard:
	let targetColumn;
	for (let m of lbMsgs) {
		src = m.embeds[0];
		if (src.fields[2].name !== "\u200B") {
			targetColumn = src.fields[2].name;

			break;
		}
	}

	/* Create the embeds: */
	let embedList = lb.toEmbeds(targetColumn);

	// Send embeds:
	for (let lbMsg of lbMsgs) {
		lbMsg.edit(embedList.shift());
	}
	for (let remaining of embedList) {
		channel.send(remaining).then(m => {
			m.react("🔄");	// :arrows_counterclockwise:
		});
	}

	channel.stopTyping();
	//console.log(`Updated ${name}.`);
}

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
global.getTeam = function getTeam(tm, guildID) {
	let team = tm;
	if (!fs.existsSync(`./teams/${guildID}/${team}.json`)) {
		let nameMap = JSON.parse(fs.readFileSync(`./teams/${this.server}/nameMap.json`));

		// The name of the team was provided:
		if (tm in nameMap) {
			team = nameMap[tm];
		} else {
			// Exception.
			return null;
		}
	}

	const Team = require("./objects/Team.js");
	return Team.fromJSON(JSON.parse(fs.readFileSync(`./teams/${guildID}/${team}.json`)));
}

global.log = async function log(triggerMsg, serverID, content) {
	let server = await bot.guilds.fetch(serverID);
	let channel;

	for (let ch of await server.channels.cache.array()) {
		if (ch.name === process.env.BOT_CHANNEL) {
			channel = ch;
			break;
		}
	}

	if (channel !== null) {
		if ((triggerMsg.content.length + content.length) < 1950) {
			channel.send(
				`${content}\n`
				+ `Triggered by <@${triggerMsg.author.id}>:\n\`\`\`\n${triggerMsg.content}\n\`\`\``
			);
		} else {
			channel.send(
				`A log message longer than 2000 characters has been triggered by: <@${triggerMsg.author.id}>.`
			);
		}
	}
}

/**
 * Sends a notification message to all students in a team.
 */
async function notifyTeamPrivately(tm, serverID, msg) {
	let team = global.getTeam(tm, serverID);

	let msgs = [];
	for (let member of team.members) {
		let usr = await bot.users.fetch(member)
		msgs.push(await usr.send(msg));
	}

	return msgs;
}

/**
 * Sends a notification message to a server, pinging all students in a team.
 */
async function notifyTeamPublicly(tm, serverID, msg) {
	if (process.env.PUBLIC_NOTIFY != "true") return;

	let team = global.getTeam(tm, serverID);

	let msgEnd = ` ${team.name}:`;
	for (let member of team.members) {
		msgEnd += ` <@${member}>`;
	}

	// Fetch news channel:
	let channel;
	for (let ch of (await bot.guilds.fetch(serverID)).channels.cache.array()) {
		if (ch.name === process.env.BOT_NEWS) {
			channel = ch;
			break;
		}
	}
	return channel.send(msg + msgEnd);
}
