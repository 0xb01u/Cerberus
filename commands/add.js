const fs = require("fs");
const { execSync } = require("child_process");

exports.run = async (bot, msg, args) => {
	if (args.length < 1 || (args[0].startsWith("./") && args.length < 2))
		return msg.reply("invalid amount of arguments for the test.");

	if (args[0].startsWith("./")) args.shift();
	let test = args.reduce((a, b) => `${a} ${b}`);

	try {
		execSync(`cd ./programs; tar xzf original.tgz; make`);
		// If all the commands are executed in one execSync(),
		// stderr gets overwritten.
		let result = execSync(`./programs/original ${test}`, { timeout: parseInt(process.env.TIMEWALL) });
		execSync(`cd ./programs; make clean`);

		let tests = fs.readdirSync("./tests/");
		let i = 0;
		while (tests.includes(`${i}.sh`)) i++;

		fs.writeFileSync(`./tests/${i}.sh`, `./programs/${process.env.BIN} ${test}\n`);
		fs.writeFileSync(`./outputs/o${i}.txt`, result);

		return msg.reply(`correctly added test ${i + 1} with result:\n${result.toString(). split("\n")[2]}`);

	} catch (exc) {
		return msg.reply(`invalid test;\n\`\`\`\n${exc.stderr}\n\`\`\``);
	}
}
