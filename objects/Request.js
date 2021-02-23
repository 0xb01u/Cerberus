const fs = require("fs");
const http = require("http");
const scraper = require("table-scraper");

/**
 * Class defining a program execution request's result (table).
 */
class Request {
	/**
	 * Constructor for a request, given its host url and server.
	 */
	constructor(url, server, save=true) {
		this.server = server;
		this.url = url;
		this.id = url.match(/\d+$/)[0];
		this.refreshCount = -1;
		this.table = {};
		this.date = (new Date(0)).toString();
		this.output = "";
		this.closed = false;	// Request finished (succesfully or with error)

		if (save) {
			this.save;
		}
	}

	/**
	 * Refreshes the request's contents.
	 */
	async refresh() {
		this.refreshCount++;

		// Only resolve refresh requests at most every 10s.
		if ((new Date()) - new Date(this.date) < 10000) return false;
		// If the request is finished, simulate a correct fetch:
		if (this.closed) return true;

		let req = [];
		let tryN = 0;
		while (req.length < 1 && tryN < 10) {
			req = await scraper.get(this.url);
			tryN++;
		}
		// TODO: exit failure.

		let request = new Promise((resolve, reject) => {
			http.get(this.url).on("response", async response => {
				response.setEncoding("utf8");
				let body = "";	// Text file.

				response.on("data", chunk => {
					body += chunk;
				});

				response.on("end", () => {
					let lines = body.replace(/\t*<!--[\s\S]*?-->/g, "").split("\n");
					let fields = lines.filter(line => line.match(/\t<th>*.*?<\/th>/))
						.map(line => line.match(/\t<th>*(.*?)<\/th>/)[1]);

					this.table = {};
					for (let i = 0; i < fields.length; i++) {
						this.table[fields[i]] = req[0][i].Output;
						// The scraper puts all values in a field called "Output".
					}
					if (this.table.Status.includes("finished")
							|| this.table.Status.includes("error")
							|| this.table.Status.includes("cancelled")) {
						this.closed = true;
					}

					this.output = this.table.Output !== "" ?
						`**Output:**\n\`\`\`\n${this.table["Output"]}\n\`\`\`` :
						"";

					this.save();

					resolve(this.table);
				});

				response.on("error", error => {
					reject(error);
				});
			});
		});

		return request;
	}

	/**
	 * Turns the request into an embed to send.
	 */
	toEmbed() {
		const Discord = require("discord.js");

		let serverName = "";
		let serverMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));
		for (let name in serverMap) {
			if (serverMap[name] == this.server) {
				serverName = name;
			}
		}

		let color = 0x888888;
		if (this.table.Status.includes("finished")) {
			color = 0x00ffff;
		} else if (this.table.Status.includes("error")) {
			color = 0xff0000;
		} else if (this.table.Status.includes("cancelled")) {
			color = 0xffff00;
		}

		let date = new Date();
		let embed = new Discord.MessageEmbed()
			.setColor(color)
			.setTitle(`Request: ${this.id}`)
			.setURL(this.url)
			.setFooter(`${serverName}#${this.id}`)
			.setTimestamp(date);
		for (let field in this.table) {
			if (field == "Request" || field == "Output") {
				continue;
			}
			if (this.table[field] == "") {
				this.table[field] = "\u200B";
			}
			embed.addField(field, this.table[field]);
		}

		return embed;
	}

	/**
	 * Saves the request as a JSON file.
	 *
	 * Requests are saved as /guild/<guild_id>/<request_id>.json
	 */
	save() {
		// Write as JSON:
		fs.writeFileSync(`./guilds/${this.server}/${this.id}.json`, JSON.stringify(this, null, 2));
	}

	// TODO: add a way to delete these.

	/**
	 * Retrieves a request from a JSON file and returns it.
	 */
	static fromJSON(json) {
		return Object.assign(new Request("http://www.some-fake-url.com1234", 0, -1, false), json);
	}
}

module.exports = Request;
