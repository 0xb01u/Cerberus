const fs = require("fs");
const { exec } = require("child_process");

exports.run = async (bot, msg) => {
	exec(`cd ./programs; make`, async (error, stdout, stderr) => {
		fs.unlinkSync(`./programs/${process.env.PROGRAM}`);
		if (error) throw error;
		if (stderr) return await msg.reply(`COMPILATION ERROR:\n\n${stderr}`);

		let tests = fs.readdirSync("./tests/");
		for (i = 0; tests.includes(`${i}.sh`); i++) {
			exec(`./tests/${i}.sh`, async (error, stdout, stderr) => {
				if (error) throw error;
				if (stderr) {
					let current = fs.readFileSync(`./tests/${i}.sh`);
					msg.reply(`test ${i + 1}: EXECUTION ERROR: \n\n${stderr}\n\nTest was: ${current.substring("../programs/".length)}`);
				}
				else if (stdout) {
					fs.writeFileSync(`./outputs/${i}.txt`, stdout);

					exec(`diff ./outputs/o${i}.txt ./outputs/${i}.txt`, async (error, stdout, stderr) => {
						if (error) throw error;
						if (stderr) msg.reply(`your program is so lame, it made a diff give an error.`);
						if (stdout) {
							let lines = stdout.split("\n");

							if (!stdout.startsWith("2c2")) {
								let current = fs.readFileSync(`./tests/${i}.sh`);
								msg.reply(`test ${i + 1}: Failed.\n\nExpected: ${lines[2].substring(2)}\nGot: ${lines[5].substring(2)}\n\nTest was: ${current.substring("./programs/".length)}`);
							} else {
								msg.reply(`test ${i + 1}: Passed.\n\n${lines[3]}`);
							}
						}
						fs.unlinkSync(`./outputs/${i}.txt`);
					});
				}
			});
		}

		exec(`cd ../programs; make clean`, (error, stdout, stderr) => {});
	});
}
