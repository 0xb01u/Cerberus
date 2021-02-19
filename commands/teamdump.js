const fs = require("fs");
const { MessageAttachment } = require("discord.js");

const Team = require("../objects/Team.js")

exports.run = async (bot, msg, args) => {
	// Server-only command:
	if (msg.channel.type === "dm") {
		return msg.author.send("That is a server-only command!");
	}

	// TODO: Role
	// "Admin"-only command:
	if (!msg.member.hasPermission("MANAGE_GUILD")) {
		return msg.reply("nice try.");
	}

	// Open the list of teams:
	let teamFiles = fs.readdirSync(`./teams/${msg.guild.id}/`);
	const teamList = teamFiles.filter(team => RegExp(`^${process.env.TEAM_PRE}\\d+`).test(team)
		&& !team.includes("#"));

	/*
	 * Form output file and output message.
	 */
	let out = "";
	let outMsg = "**List of teams:**\n\n";
	let msgArray = [];
	for (let teamFile of teamList) {
		let team = Team.fromJSON(JSON.parse(fs.readFileSync(`./teams/${msg.guild.id}/${teamFile}`)));

		outMsg += `**${team.id}:** `;
		for (let member of team.members) {
			out += `${team.id} ${member}\n`;
			outMsg += `<@${member}> `;
		}
		outMsg += "\n";

		if (outMsg.length >= 2000 - (10 + process.env.TEAM_CAPACITY * (22 + 1) + 1)) {
		// 2000 = maximum message length.
		// 10 = "**gXXX:** " length.
		// 22 = <@!memberID> length.
		// 1 = space or newline length.
			msgArray.push(outMsg);
			outMsg = "";
		}
	}

	// Check if a channel was provided to dump the teams to:
	if (args.length > 0) {
		// Check if the channel was properly formated:
		if (!args[0].startsWith("<#") || !args[0].endsWith(">")) {
			return msg.reply(`\`${args[0]}\` is not a valid channel! (Tip: it must start with \`#\`).`);
		}

		// Send message(s):
		let sent = false;
		for (let ch of msg.guild.channels.cache.array()) {
			if (ch.id === args[0].slice(2, args[0].length - 1)) {
				for (let m of msgArray) {
					ch.send(m);
				}
				ch.send(outMsg);
				sent = true;

				break;
			}
		}

		if (!sent) {
			return msg.reply("you are so funny, aren't you?");
		}
	}

	// Send the list of teams as plain text:
	fs.writeFileSync(`./teams/${msg.guild.id}/teamList.txt`, out);
	let att = new MessageAttachment(`./teams/${msg.guild.id}/teamList.txt`);
	msg.channel.send("List of teams on the server:", att);
}
