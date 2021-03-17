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
		return msg.reply("where should I send that team? And... why?");
	}

	let server = msg.guild.id;

	let teamFiles = fs.readdirSync(`./teams/${server}/`);
	const teamList = teamFiles.filter(team => RegExp(`^${process.env.TEAM_PRE}\\d+.json$`).test(team)
		&& !team.includes("#"));

	if (args.length < 2) {		
		return msg.reply(
			`usage: \`${process.env.PRE}teamsend <team> <message ...>.\``
		);
	}

	let tm = args.shift();
	if (!teamList.includes(`${tm}.json`)) {
		return msg.reply(
			`there is no team "${tm}" on the server.`
		);
	}

	let team = global.getTeam(tm, server);
	let teamMsg = args.join(" ");

	for (let member of team.members) {
		bot.users.fetch(member).then(user => {
			user.send(teamMsg);
		});
	}
	
}
