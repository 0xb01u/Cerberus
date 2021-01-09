const fs = require("fs");

const Team = require("../objects/Team.js");

/**
 * Team manager command.
 *
 * Currently supports: join, leave, rename.
 */
exports.run = async (bot, msg, args, serverID) => {	
	let server = serverID;
	let guild = await bot.guilds.fetch(serverID);	// Server object.

	// Create directories if they don't exist:
	if (!fs.existsSync(`./teams`)) fs.mkdirSync(`./teams/${server}`, { recursive: true });
	else if (!fs.existsSync(`./teams/${server}`)) fs.mkdirSync(`./teams/${server}`);
	// TODO: remove checks from any other place in the code. (First time used is always here.)

	// TODO: filter non-team files:
	const teamList = fs.readdirSync(`./teams/${server}/`);

	switch (args[0]) {
		// TODO: split into team join and create?
		// TODO: check exact number of arguments.
		case "join":
			let user = msg.author.id;

			// Check if the author is already on a team.
			if (fs.existsSync(`./teams/${server}/teamMap.json`)) {
				let teamMap = JSON.parse(`./teams/${server}/teamMap.json`);
				if (teamMap.contains(user)) {
					// TODO: Handle this exception;
					return await msg.author.send(
						`Looks like your trying to join a team on server ${guild.name}, ` +
						`but you're already on team ${teamMap[user]} there. ` +
						`You cannot join more than one team!`
					);
				}
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
							`Correctly joined team ${teamID} on server ${guild.name}.`
						);
					} else {
						msg.author.send(
							`There was a problem trying to join team ${teamID} on server ${guild.name}.`
						);
					}
				} else {
					let team = Team.fromJSON(JSON.parse(`./teams/${server}/${teamID}.json`));
					if (team.request(msg.author.id, bot)) {
						msg.author.send(
							`Correctly sent a request to join team ${teamID} on server ${guild.name}.`
						);
					} else {
						msg.author.send(
							`There was a problem trying to send a request to join team ${teamID} on server ${guild.name}.\n` +
							`Maybe the team is already full?`
						);
					}
				}
				return;

			// Generate random ID:
			} else {
				// TODO: filter teachers and other non-students;
				let totalTeams = Math.ceil(guild.memberCount / process.env.TEAM_CAPACITY);

				if (teamList.length - 2 >= totalTeams) {
					// TODO: handle this exception.
					return;
				}

				let totalTeamsCopy = totalTeams;
				let diigits = 0;

				do {
					totalTeamsCopy /= 10;
					digits++;
				} while (totalTeamsCopy > 0);

				do {
					let rndNum = Math.floor(Math.random() * totalTeams)
					teamID = 'g' + (rndNum).toLocaleString('en-US', {minimumInteberDigits: digits, useGrouping: false})
				} while (teamList.includes(teamID));

				let team = new Team(teamID);
				if (team.join(msg.author.id)) {
					msg.author.send(
						`Correctly joined team ${teamID} on server ${guild.name}.`
					);
				} else {
					msg.author.send(
						`There was a problem trying to join team ${teamID} on server ${guild.name}.`
					);
				}
			}
			return;

		case "leave":
			let user = msg.author.id;

			if (!fs.existsSync(`./teams/${server}/teamMap.json`)) {
				// TODO: Handle this exception.
				return await msg.author.send(
					`Looks like you are trying to **leave** your team on server ${guild.name}, ` +
					`but you are not part of any team there!`
				);
			}

			let teamMap = JSON.parse(`./teams/${server}/teamMap.json`);
			if (!teamMap.contains(user)) {
				// TODO: Handle this exception;
				return await msg.author.send(
					`Looks like you are trying to **leave** your team on server ${guild.name}, ` +
					`but you are not part of any team there!`
				);
			}

			let team = Team.fromJSON(JSON.parse(`./teams/${server}/${teamMap[user]}.json`));

			if (team.confirmed) {
				return await msg.author.send(
					`Looks like you are trying to **leave** team ${team.name} on server ${guild.name}, ` +
					`but that team is definitive, and only a server admin can edit it now. ` +
					`Maybe you'd want to message them instead and explain why you want to leave your team.`
				);
			}

			team.leave(user);
			return;

		case "rename":
			let user = msg.author.id;

			if (!fs.existsSync(`./teams/${server}/teamMap.json`)) {
				// TODO: Handle this exception.
				return await msg.author.send(
					`Looks like you are trying to **rename** your team on server ${guild.name}, ` +
					`but you are not part of any team there!`
				);
			}

			let teamMap = JSON.parse(`./teams/${server}/teamMap.json`);
			if (!teamMap.contains(user)) {
				// TODO: Handle this exception;
				return await msg.author.send(
					`Looks like you are trying to **rename** your team on server ${guild.name}, ` +
					`but you are not part of any team there!`
				);
			}

			let team = Team.fromJSON(JSON.parse(`./teams/${server}/${teamMap[user]}.json`));

			if (args.length < 3) {
				// TODO: Handle this exception;
				return await msg.author.send(
					`Looks like you are trying to **rename** your team ${team.name} on server ${guild.name}, ` +
					`but you didn't provide any new name! Use the command like this:\n`
					`!team rename newCoolName`
				);				
			}

			if (args[2].length > 16) {
				// TODO: Handle this exception;
				return await msg.author.send(
					`Looks like you are trying to **rename** your team  ${team.name} on server ${guild.name}, ` +
					`but the name given is too long. Team names must be at most 16 characters long.`
				);				
			}

			team.changeName(newName);

			return await msg.author.send(
				`Correctly changed the name of the team ${team.id} on server ${guild.name} to ${team.name}.`
			);
	}
}
