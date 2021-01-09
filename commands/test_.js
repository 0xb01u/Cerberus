const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Send a program to the client.
 */	
exports.run = async (bot, msg, args, file) => {
	// Just send the program to the client:
	try {
		execSync(`python2 ./tools/client ./programs/${file} ${args.reduce(((a, b) => `${a} ${b}`))}`);
		fs.unlinkSync(`./programs/${file}`);
	} catch (exc) {
		fs.unlinkSync(`./programs/${file}`);
	}
}
