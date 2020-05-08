const fs = require("fs");
const { execSync } = require("child_process");

exports.run = async (bot, msg) => {
	try {
		execSync(`cd ./programs; make`);
	} catch (exc) {
		fs.unlinkSync(`./programs/${process.env.PROGRAM}`);

		return await msg.reply(`COMPILATION ERROR:\n ${exc.stderr}`);
	}

	fs.unlinkSync(`./programs/${process.env.PROGRAM}`);

	let tests = fs.readdirSync("./tests/");
	for (i = 0; tests.includes(`${i}.sh`); i++) {
		let result = "";
		try {
			result = execSync(`./tests/${i}.sh`).toString();
		} catch (exc) {
			execSync(`cd ../programs; make clean`);

			let current = fs.readFileSync(`./tests/${i}.sh`).toString();
			return await msg.reply(`test ${i + 1}: EXECUTION ERROR:\n${exc.stderr}\n\nTest was: ${current.substring("./programs/".length)}`)
		}

		fs.writeFileSync(`./outputs/${i}.txt`, result);

		try {
			execSync(`diff ./outputs/o${i}.txt ./outputs/${i}.txt`);
		} catch (exc) {

			let lines = exc.stdout.toString().split("\n");

			if (lines[0] != "2c2") {
				let current = fs.readFileSync(`./tests/${i}.sh`).toString();
				console.log(lines);
				await msg.reply(`test ${i + 1}: Failed.\nExpected: ${lines[2].substring(10)}\nGot: ${lines[5].substring(10)}\n\nTest was: ${current.substring("./programs/".length)}`);
			} else {
				await msg.reply(`test ${i + 1}: Passed.\n${lines[3].substring(2)}`);
			}
		}
		fs.unlinkSync(`./outputs/${i}.txt`);
	}

	execSync(`cd ./programs; make clean`);
}
