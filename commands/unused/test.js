const fs = require("fs");

/**
 * Returns the specification for the given test,
 * as a bash executable command.
 */
exports.run = async (bot, msg, args) => {
	/* FEATURE NOT APPLICABLE BY HERMES */
	return msg.reply("feature not implemented yet.");

	/*--- ORIGINAL SOURCE CODE ---*/
	if (args.length < 1) {
		return msg.reply(`invalid usage: ${process.env.PRE}test <number>`);
	}

	// Remove duplicates:
	args = args.filter((value, index, self) => self.indexOf(value) === index);

	let output = `\n`;
	for (i of args) {
		try {
			output += `**Test ${i}**: \`.${fs.readFileSync(`./tests/${i - 1}.sh`).toString().substring(`./programs`.length)}\``;
		} catch (exc) {
			msg.reply(`invalid test number: ${i}.`);
		}
	}

	if (output != `\n`) return msg.reply(output);
}
