const fs = require("fs");

const Team = require("../objects/Team.js");
const TeamConfirmation = require("../objects/TeamConfirmation.js");

/**
 * Team manager command.
 *
 * Currently supports: join, leave, rename.
 */
exports.run = async (bot, msg, args, serverID) => {
	// Variables initialization:
	let server = serverID;
	let user = msg.author.id;
	let guild = await bot.guilds.fetch(serverID);	// Server object.
	let serverName = guild.name;
	let student = global.getStudent(user);	// Student object.
	let userTeams = student.credentials;


	// Create directories if they don't exist:
	if (!fs.existsSync(`./teams`)) fs.mkdirSync(`./teams/${server}`, { recursive: true });
	else if (!fs.existsSync(`./teams/${server}`)) fs.mkdirSync(`./teams/${server}`);
	// TODO: remove checks from any other place in the code. (First time used is always here.)

	// TODO: filter non-team files:
	const teamList = fs.readdirSync(`./teams/${server}/`);

	switch (args[0]) {
		// TODO: split into team join and create?
		// TODO: check exact number of arguments.
		case "join":{
			// Check if the author is already on a team for that server.
			if (server in userTeams) {
				// TODO: Handle this exception;
				return msg.author.send(
					`Looks like your trying to join a team on server ${serverName}, ` +
					`but you're already on team ${userTeams[server].team} there. ` +
					`You cannot join more than one team!`
				);
			}

			let teamID = "g110";
			let IDgiven = false;

			// Check if a team ID was given.
			if (args.length > 1) {
				if (!/^g\d+/.test(args[1])) {
					// TODO: handle this exception.
				} else {
					IDgiven = true;
					teamID = args[1];
				}
			}

			// Join an existing team, if specified.
			if (IDgiven) {
				// TODO: add support to join by name.
				if (!teamList.includes(teamID)) {
					// TODO: handle this exception.
					return;
				}

				// Create team if it doesn't exist already.
				if (!fs.existsSync(`./teams/${server}/${teamID}.json`)) {
					let team = new Team(teamID);
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
							`There was a problem trying to send a request to join team ${teamID} on server ${serverName}.\n` +
							`Maybe the team is already full?`
						);
					}
				}
				return;	// Feedback message sent in the if-elses above.

			// Generate random ID:
			} else {
				// TODO: filter teachers and other non-students;
				let totalTeams = Math.ceil(guild.memberCount / process.env.TEAM_CAPACITY);

				if (teamList.length - 2 >= totalTeams) {
					// TODO: handle this exception.
					return;
				}

				let totalTeamsCopy = totalTeams;
				let digits = 0;

				do {
					totalTeamsCopy /= 10;
					digits++;
				} while (totalTeamsCopy > 0);

				do {
					let rndNum = Math.floor(Math.random() * totalTeams);
					teamID = 'g' + (rndNum).toLocaleString('en-US', {minimumInteberDigits: digits, useGrouping: false})
				} while (teamList.includes(teamID));

				let team = new Team(teamID);
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
				// TODO: Handle this exception.
				return msg.author.send(
					`Looks like you are trying to **leave** your team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let team = global.getTeam(userTeams[server], server);

			if (team.confirmed) {
				return msg.author.send(
					`Looks like you are trying to **leave** team ${team.name} on server ${serverName}, ` +
					`but that team is definitive, and only a server admin can edit it now. ` +
					`Maybe you'd want to message them instead and explain why you want to leave your team.`
				);
			}

			team.leave(user);
			return msg.send(
				`Succsesfully left team ${team.name}.`
			);}

		case "rename":{
			if (!(server in userTeams)) {
				// TODO: Handle this exception;
				return msg.author.send(
					`Looks like you are trying to **rename** your team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let team = global.getTeam(userTeams[server], server);

			if (args.length < 3) {
				// TODO: Handle this exception;
				return msg.author.send(
					`Looks like you are trying to **rename** your team ${team.name} on server ${serverName}, ` +
					`but you didn't provide any new name! Use the command like this:\n`
					`!team rename newCoolName`
				);				
			}

			if (args[2].length > 16) {
				// TODO: Handle this exception;
				return msg.author.send(
					`Looks like you are trying to **rename** your team  ${team.name} on server ${serverName}, ` +
					`but the name given is too long. Team names must be at most 16 characters long.`
				);				
			}

			team.changeName(newName);

			return msg.author.send(
				`Correctly changed the name of the team ${team.id} on server ${serverName} to ${team.name}.`
			);}

		case "accept":{
			if (!(server in userTeams)) {
				// TODO: Handle this exception.
				return msg.author.send(
					`Looks like you are trying to **accept** a member on a team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let reqID = args[1];
			if (!fs.existsSync(`./teams/${server}/${reqID}.json`)) {
				// TODO: Handle this exception.
				return msg.author.send(
					`Looks like you are trying to **accept** a member on team ${userTeams[server]} on server ${serverName}, ` +
					`but they didn't send any request to join it! Did you get the request number wrong?`
				);
			}

			let request = TeamConfirmation.fromJSON(JSON.parse(fs.readFileSync(`./teams/${server}/${reqID}.json`)));
			request.accept(user);

			return msg.author.send(
				`You accepted <@${request.usr}>'s request.`
			);}

		case "reject":{
			if (!(server in userTeams)) {
				// TODO: Handle this exception.
				return msg.author.send(
					`Looks like you are trying to **reject** a member on a team on server ${serverName}, ` +
					`but you are not part of any team there!`
				);
			}

			let reqID = args[1];
			if (!fs.existsSync(`./teams/${server}/${reqID}.json`)) {
				// TODO: Handle this exception.
				return msg.author.send(
					`Looks like you are trying to **reject** a member on team ${userTeams[server]} on server ${serverName}, ` +
					`but they didn't send any request to join it! Did you get the request number wrong?`
				);
			}

			let request = TeamConfirmation.fromJSON(JSON.parse(fs.readFileSync(`./teams/${server}/${reqID}.json`)));
			request.reject(user, bot);

			return;} // Feedback message in reject() method.

		// TODO: add default.
	}
}
