const fs = require("fs");

const Team = require("../objects/Team.js");
const TeamConfirmation = require("../objects/TeamConfirmation.js");

/**
 * Team manager command.
 *
 * Currently supports: join, leave, rename, accept and reject.
 */
exports.run = async (bot, msg, args, serverID) => {
	if (serverID == null) return;
	// Variables initialization:
	let server = serverID;
	let user = msg.author.id;
	let guild = await bot.guilds.fetch(serverID);	// Server object.
	let serverName = guild.name;
	let student = global.getStudent(user);	// Student object.
	let userTeams = student.credentials;

	if (args.length < 1) {
		let reply = await msg.reply("please, choose an option for the command:\n" +
			`\`${process.env.PRE}team [join|leave|accept|reject]\`\n\n`);
		if (msg.channel.type !== "dm") {
			reply.delete({ timeout: 30000 });
			msg.delete({ timeout: 30000 });
		}

		return;
	}

	// Create directories if they don't exist:
	if (!fs.existsSync(`./teams`)) fs.mkdirSync(`./teams/${server}`, { recursive: true });
	else if (!fs.existsSync(`./teams/${server}`)) fs.mkdirSync(`./teams/${server}`);

	let teamFiles = fs.readdirSync(`./teams/${server}/`);
	const teamList = teamFiles.filter(team => RegExp(`^${process.env.TEAM_PRE}\\d+`).test(team)
		&& !team.includes("#"));

	switch (args[0]) {
		case "join":{

			// Check if the author is already on a team for that server.
			if (server in userTeams) {
				return msg.author.send(
					`It looks like your trying to join a team on server ${serverName}, ` +
					`but you're already on team ${userTeams[server].team} there. ` +
					`You cannot join more than one team!`
				);
			}

			let teamID = "g110";
			let IDgiven = false;

			// Check if a team ID was given.
			if (args.length > 1) {
				if (!RegExp(`^${process.env.TEAM_PRE}\\d+`).test(args[1])) {
					let reply = await msg.reply("the team ID you've entered is not correct. " +
						`It should be a number preceded by ${process.env.TEAM_PRE}.`);
					
					if (msg.channel.type !== "dm") {
						reply.delete({ timeout: 30000 });
						msg.delete({ timeout: 30000 });
					}
				} else {
					IDgiven = true;
					teamID = args[1];
				}
			}

			// Join an existing team, if specified.
			if (IDgiven) {
				// TODO: add support to join by name.
				if (!teamList.includes(`${teamID}.json`)) {
					let reply = await msg.author.send(`There's no team with ID ${teamID} on server ` +
						`${serverName} yet.\n` +
						"Currently, creating a team with a predefined ID is not supported. " +
						`Use \`${process.env.PRE}team join\` to create and join a team with ` +
						"a random ID, or specify the ID of an existing team to request " +
						"joining it.\nIf you think this is an error, contact the system admin!"
					);

					if (msg.channel.type !== "dm") {
						msg.delete({ timeout: 30000 });
					}

					return;
				}

				// Create team if it doesn't exist already.
				if (!fs.existsSync(`./teams/${server}/${teamID}.json`)) {
					let team = new Team(teamID, server);
					// Automatically join team: no confirmation needed,
					// as it is the first user to request it:
					if (team.join(msg.author.id)) {
						msg.author.send(
							`Correctly joined team ${teamID} on server ${serverName}.`
						);
					} else {
						msg.author.send(
							`There was a problem trying to join team ${teamID} on server ${serverName}.`
						);
					}
				} else {
					let team = global.getTeam(teamID, server);
					if (team.request(msg.author.id, bot)) {
						msg.author.send(
							`Correctly sent a request to join team ${teamID} on server ${serverName}.`
						);
					} else {
						msg.author.send(
							`There was a problem trying to send a request to join team ` +
							`${teamID} on server ${serverName}.\n` +
							`Maybe the team is already full?`
						);
					}
				}

				// Check if the team has been completed, and log it.
				let team = global.getTeam(teamID, server);
				if (team.confirmed) {
					let teamCreationLog = `Team ${teamID} has been created! ( `;
					for (let member of team.members) {
						teamCreationLog += `<@${member}> `
					}
					teamCreationLog += `).`;

					for (channel of await guild.channels.cache.array()) {
						if (channel.name === process.env.BOT_CHANNEL) {
							channel.send(teamCreationLog);
						}
					}
				}

				return;	// Feedback message sent in the if-elses above.

			// Generate random ID:
			} else {
				// TODO: account for !team leave!!!

				/*let maxTeams = Math.ceil(guild.memberCount / process.env.TEAM_CAPACITY);

				let maxTeamsCopy = maxTeams;
				let digits = 0;

				do {
					maxTeamsCopy /= 10;
					digits++;
				} while (maxTeamsCopy > 0);
				*/
				let digits = 2;

				let num = teamList.length + 1;
				teamID = 'g' + (num).toLocaleString('en-US', {minimumIntegerDigits: digits, useGrouping: false});

				let team = new Team(teamID, server);
				if (team.join(msg.author.id)) {
					msg.author.send(
						`Correctly joined team ${teamID} on server ${serverName}.`
					);
				} else {
					msg.author.send(
						`There was a problem trying to join team ${teamID} on server ${serverName}.`
					);
				}
			}
			return;}	// Feedback message in the if-elses above.

		case "leave":{
			if (!(server in userTeams)) {
				return msg.author.send(
					`It looks like you are trying to **leave** your team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let team = global.getTeam(userTeams[server].team, server);

			if (team.confirmed) {
				return msg.author.send(
					`It looks like you are trying to **leave** team ${team.name} on server ${serverName}, ` +
					`but that team is definitive, and only a server admin can edit it now. ` +
					`Maybe you'd want to message them instead and explain why you want to leave your team.`
				);
			}

			team.leave(user);
			return msg.author.send(
				`Succsesfully left team ${team.name}.`
			);}

		/*
		case "rename":{
			if (args.length < 2) {
				let reply = await msg.reply("you should tell me what team you want me to rename!");

				if (msg.channel.type !== "dm") {
					reply.delete({ timeout: 30000 });
					msg.delete({ timeout: 30000 });
				}
			}

			if (!(server in userTeams)) {
				return msg.author.send(
					`It looks like you are trying to **rename** your team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let team = global.getTeam(userTeams[server], server);

			if (args.length < 3) {
				return msg.author.send(
					`It looks like you are trying to **rename** your team ${team.name} on server ${serverName}, ` +
					`but you didn't provide any new name! Use the command like this:\n`
					`!team rename newCoolName`
				);				
			}

			if (args[2].length > 16) {
				return msg.author.send(
					`It looks like you are trying to **rename** your team  ${team.name} on server ${serverName}, ` +
					`but the name given is too long. Team names must be at most 16 characters long.`
				);				
			}

			team.changeName(newName);

			return msg.author.send(
				`Correctly changed the name of the team ${team.id} on server ${serverName} to ${team.name}.`
			);}
		*/

		case "accept":{
			if (!(server in userTeams)) {
				return msg.author.send(
					`It looks like you are trying to **accept** a member on a team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let reqID = args[1];
			if (!fs.existsSync(`./teams/${server}/${reqID}.json`)) {
				return msg.author.send(
					`It looks like you are trying to **accept** a member on team` +
					`${userTeams[server]} on server ${serverName}, ` +
					`but they didn't send any request to join it! Did you get the request number wrong?`
				);
			}

			let request = TeamConfirmation.fromJSON(JSON.parse(fs.readFileSync(`./teams/${server}/${reqID}.json`)));
			let teamID = request.tm.id;
			request.accept(user, bot);

			// Check if the team has been completed, and log it.
			let team = global.getTeam(teamID, server);
			if (team.confirmed) {
				let teamCreationLog = `Team ${teamID} has been created! ( `;
				for (let member of team.members) {
					teamCreationLog += `<@${member}> `
				}
				teamCreationLog += `).`;

				for (channel of await guild.channels.cache.array()) {
					if (channel.name === process.env.BOT_CHANNEL) {
						channel.send(teamCreationLog);
					}
				}
			}

			return msg.author.send(
				`You accepted <@${request.usr}>'s request.`
			);}

		case "reject":{
			if (!(server in userTeams)) {
				return msg.author.send(
					`It looks like you are trying to **reject** a member on a team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let reqID = args[1];
			if (!fs.existsSync(`./teams/${server}/${reqID}.json`)) {
				return msg.author.send(
					`It looks like you are trying to **reject** a member on team ${userTeams[server]} on server ${serverName}, ` +
					`but they didn't send any request to join it! Did you get the request number wrong?`
				);
			}

			let request = TeamConfirmation.fromJSON(JSON.parse(fs.readFileSync(`./teams/${server}/${reqID}.json`)));
			request.reject(user, bot);

			return;} // Feedback message in reject() method.


		case "help":
			return msg.author.send(
				`Usage: \`${process.env.PRE}team <serverName> [option] <args>\`\n\n`
			+ `The \`serverName\` must be specified when using these commands via DM. `
			+ "When using them on a server, it mustn't be specified.\n"
			+ "The `serverName` must replace all spaces with underscores (`_`).\n\n"
			+ `With \`${process.env.PRE}team join\` you can create and join a new team.\n`
			+ `With \`${process.env.PRE}team join [teamID]\` you can join an already existing team.\n`
			+ `**DM only:** With \`${process.env.PRE}team [serverName] accept [requestID], you can accept`
			+ `a membership request for your team (I will tell you when to do this).\n`
			+ `**DM only:** With \`${process.env.PRE}team [serverName] reject [requestID], you can reject`
			+ `a membership request for your team (I will tell you when to do this).\n`
			+ `With \`${process.env.PRE}team leave\`, you can leave your team, as long as `
			+ "it **isn't full**"
			);

		default:
			msg.author.send("I don't recognize that option :(\n"
				+ `Use \`${process.env.PRE}team help\` for help.`)

			if (msg.channel.type !== "dm") {
				msg.delete({ timeout: 30000 });
			}
			return;
	}
}
