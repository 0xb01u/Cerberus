const fs = require("fs");

exports.run = async (bot, msg, args) => {
	if (args.length < 1) return msg.reply("you must specify the number of the test to delete.");

	for (i of args) {
		try {
			fs.unlinkSync(`./tests/${i - 1}.sh`);
			fs.unlinkSync(`./outputs/c${i - 1}.txt`);
		} catch (exc) {
			return msg.reply(`invalid test number: ${i}.`);
		}
	}

	let tests = fs.readdirSync(`./tests`).map((e) => e.substring(0, e.length - 3));
	let last = Math.max(...tests);

	let src = 0;
	let dest = 0;
	while (src <= last) {
		if (tests.includes(`${src}`)) {
			fs.writeFileSync(`./tests/${dest}.sh`, fs.readFileSync(`./tests/${src}.sh`).toString());
			fs.writeFileSync(`./outputs/c${dest}.txt`, fs.readFileSync(`./outputs/c${src}.txt`).toString());
			dest++;
		}
		src++;
	}

	while (dest < src) {
		fs.unlinkSync(`./tests/${dest}.sh`);
		fs.unlinkSync(`./outputs/c${dest}.txt`);
		dest++;
	}

	return msg.reply(`correctly deleted tests: ${args}.\n Tests have been re-ordered.`);
}
