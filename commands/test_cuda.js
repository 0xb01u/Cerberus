const fs = require("fs");
const { exec } = require("child_process");

exports.run = async (bot, msg) => {
	const compilation = exec(`cd ../programs; make`, (error, stdout, stderr) => {
		if (error) throw error;
		if (stderr) return msg.reply(`COMPILATION ERROR:\n\n${stderr}`);
	});
	fs.unlink(`../programs/${PROGRAM}`, err => { if (err) throw err; });

	// WIP

	const clean = exec(`cd ../programs; make clean`, (error, stdout, stderr) => {});
}
