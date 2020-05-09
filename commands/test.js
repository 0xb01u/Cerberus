const fs = require("fs");

exports.run = async (bot, msg, args) => {
	if (args.length < 1) {
		return msg.reply(`invalid usage: ${process.env.PRE}test <number>`);
	}

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
