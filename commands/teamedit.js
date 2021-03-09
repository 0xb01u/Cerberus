const fs = require("fs");

const Team = require("../objects/Team.js");

exports.run = async (bot, msg, args) => {
	// Server-only command:
	if (msg.channel.type === "dm") {
		return msg.author.send("That is a server-only command!");
	}

	// TODO: Role
	// "Admin"-only command:
	if (!msg.member.hasPermission("MANAGE_GUILD")) {
		return msg.reply("nope.");
	}

	let server = msg.guild.id;

	let teamFiles = fs.readdirSync(`./teams/${server}/`);
	const teamList = teamFiles.filter(team => RegExp(`^${process.env.TEAM_PRE}\\d+.json$`).test(team)
		&& !team.includes("#"));

	let usr, tm;
	switch (args[0]) {
		case "move":{
			if (args[1].match(/^<@!?\d+>$/) && RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[2])) {
				usr = args[1].match(/^<@!?(\d+)>$/)[1];
				tm = args[2];
			} else if (args[2].match(/^<@!?\d+>$/) && RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[1])) {
				usr = args[2].match(/^<@!?(\d+)>$/)[1];
				tm = args[1];
			} else {
				return msg.reply(
					`the arguments do not have the correct format: ` +
					`\`${process.env.PRE}teamedit move <@user> <newTeam>\``
				);
			}

			let student = global.getStudent(usr);
			let oldTeam = null;
			if (server in student.credentials) {
				oldTeam = global.getTeam(student.credentials[server].team, server);
				oldTeam.leave(usr);
			}

			let team;
			if (teamList.includes(`${tm}.json`)) {
				team = global.getTeam(tm, server);
			} else {
				team = new Team(tm, server);
			}
			team.join(usr);

			return msg.reply(
				`correctly moved <@${usr}> ` +
					(oldTeam !==  null ? `from ${oldTeam.id} ` : ``) +
				`to ${tm}.`
			);}

		case "add":{
			if (args[1].match(/^<@!?\d+>$/) && RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[2])) {
				usr = args[1].match(/^<@!?(\d+)>$/)[1];
				tm = args[2];
			} else if (args[2].match(/^<@!?\d+>$/) && RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[1])) {
				usr = args[2].match(/^<@!?(\d+)>$/)[1];
				tm = args[1];
			} else {
				return msg.reply(
					`the arguments do not have the correct format: ` +
					`\`${process.env.PRE}teamedit add <@user> <team>\``
				);
			}

			let team;
			if (teamList.includes(`${tm}.json`)) {
				team = global.getTeam(tm, server);
			} else {
				team = new Team(tm, server);
			}
			team.join(usr);

			return msg.reply(
				`correctly added <@${usr}> to the team ${tm}.`
			);}

		case "remove":{
			if (args[1].match(/^<@!?\d+>$/) && RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[2])) {
				usr = args[1].match(/^<@!?(\d+)>$/)[1];
				tm = args[2];
			} else if (args[2].match(/^<@!?\d+>$/) && RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[1])) {
				usr = args[2].match(/^<@!?(\d+)>$/)[1];
				tm = args[1];
			} else {
				return msg.reply(
					`the arguments do not have the correct format: ` +
					`\`${process.env.PRE}teamedit remove <@user> <team>\``
				);
			}

			if (!teamList.includes(`${tm}.json`)) {
				return msg.reply(
					"that team doesn't exist."
				);
			}

			let team = global.getTeam(tm, server);
			if (!team.members.includes(usr)) {
				return msg.reply(
					"that user isn't part of that team already."
				);
			}
			team.leave(usr);

			return msg.reply(
				`correctly removed <@${usr}> from the team ${tm}. ` +
				"(Don't forget to `unconfirm` the team if necessary.)"
			);}

		case "setEditable":
		case "unconfirm":{
			let tm;
			if (!RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[1])) {
				return msg.reply(
					"no valid team ID was provided."
				);
			}

			tm = args[1];

			if (!teamList.includes(`${tm}.json`)) {
				return msg.reply(
					"that team doesn't exist."
				);
			}

			let team = global.getTeam(tm, server);
			team.unconfirm();

			return msg.reply(
				`done. Team ${tm} is now editable.`
			);}

		case "confirm":{
			let tm;
			if (!RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[1])) {
				return msg.reply(
					"no valid team ID was provided."
				);
			}

			tm = args[1];

			if (!teamList.includes(`${tm}.json`)) {
				return msg.reply(
					"that team doesn't exist."
				);
			}

			let team = global.getTeam(tm, server);
			team.confirm();

			return msg.reply(
				`OK. Team ${tm} is no longer editable.`
			);}

		case "password":
		case "passwd":
		case "pswd":
		case "pass":{
			let tm;

			if (args.length < 3) {
				//msg.delete();
				return msg.reply(
					`you have to specify a team and its new password: ` +
					`\`${process.env.PRE}teamedit ${args[1]} <teamID> <newPassword>\`.`
				);
			}

			if (!RegExp(`^${process.env.TEAM_PRE}\\d+$`).test(args[1])) {
				//msg.delete();
				return msg.reply(
					"no valid team ID was provided."
				);
			}

			tm = args[1];

			if (!teamList.includes(`${tm}.json`)) {
				//msg.delete();
				return msg.reply(
					"that team doesn't exist."
				);
			}

			let team = global.getTeam(tm, server);

			team.setPassword(args[2]);

			//msg.delete();
			return msg.reply(
				`The password for ${tm} was updated succesfully.`
			);}

		// TODO: rename.

		default:
			return msg.reply(
				`options: \`move, add, remove, setEditable/unconfirm, confirm, password/passwd/pass/pswd\`.`
			);
	}
}
