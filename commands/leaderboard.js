const Discord = require("discord.js");

const Leaderboard = require("../objects/Leaderboard.js")

exports.run = async (bot, msg, args, serverID) => {
	// Server-only command:
	if (msg.channel.type === "dm") {
		return msg.author.send("That is a server-only command!");
	}

	// TODO: Role
	// "Admin"-only command:
	if (!msg.member.hasPermission("MANAGE_GUILD")) {
		return msg.reply("who, me?");
	}

	// Channel-specific command:
	if (msg.channel.name !== process.env.LB_CHANNEL) {
		msg.delete();
		return msg.author.send(
			`Oh no! :(\nYou used the \`${process.env.PRE}leaderboard\` command in the wrong channel!\n`
			+ `It can only be used in #${process.env.LB_CHANNEL}.`
		);
	}

	if (args.length < 3 || !args[0].match(/^https?:\/\//)) {
		return msg.reply("I need at least one URL, one leaderboard name " +
			"and one field name to fetch a leaderboard. :sweat_smile:");
	}

	let url = args[0];
	let name = args[1];
	let targetColumn = args[2];

	// TODO: try-catch;
	// Create new leaderboard:
	let lb = new Leaderboard(url, name, serverID);
	let table = await lb.refresh();

	/* NOT NEEDED IN THIS CASE
	// If the refresh request wasn't processed, return.
	if (!table) return;
	*/

	if (args.length > 3) {
		lb.setDescription(args.splice(3).join(" "));
	}

	let date = new Date();
	let embedList = [];
	let embed = new Discord.MessageEmbed()
		.setColor(0x00ff00);
	embed.setTitle(`Leaderboard ${lb.name}`)
		.setURL(lb.url)
		.setFooter(lb.name)
		.setTimestamp(date);
	if (lb.description !== null) {
		embed.setDescription(lb.description);
	}
	embed.addFields(
		{ name: "Pos", value: "\u200B", inline: true },
		{ name: "Team", value: "\u200B", inline: true },
		{ name: targetColumn, value: "\u200B", inline: true }
	);

	let fieldCount = 1;
	let i = 1;
	for (let entry of table) {
		if (entry["Pos"] == "") {
			embed.addFields(
				{ name: "\u200B", value: "\u200B", inline: true },
				{ name: "\u200B", value: entry["Program"], inline: true },
				{ name: "\u200B", value: entry[targetColumn], inline: true }
			);
		} else {
			embed.addFields(
				{ name: "\u200B", value: entry["Pos"], inline: true },
				{ name: "\u200B", value: entry["User"], inline: true },
				{ name: "\u200B", value: entry[targetColumn], inline: true }
			);
		}

		fieldCount++;
		if (fieldCount % 8 === 0) {
			embedList.push(embed);
			embed = new Discord.MessageEmbed()
				.setDescription(lb.description)
				.setColor(0x00ff00)
				.setFooter(lb.name)
				.setTimestamp(date);
		}
	}
	embedList.push(embed);

	// Fetch destination channel:
	let channel;
	for (let ch of msg.guild.channels.cache.array()) {
		if (ch.name === process.env.LB_CHANNEL) {
			channel = ch;

			break;
		}
	}

	// Send embeds:
	for (let table of embedList) {
		let outMsg = await channel.send(table);
		outMsg.react("🔄");	// :arrows_counterclockwise:
	}
	return;
}
