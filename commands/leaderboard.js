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
		return msg.reply(
			"I need at least one URL, one leaderboard name " +
			"and one field name to fetch a leaderboard. :sweat_smile:"
		);
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

	let embedList = lb.toEmbeds(targetColumn);

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
		channel.send(table).then(outMsg => {
			outMsg.react("🔄");	// :arrows_counterclockwise:
		});
	}
	return;
}
