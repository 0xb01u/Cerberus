const fs = require("fs");
const http = require("http");
const scraper = require("table-scraper");

/**
 * Class defininf a leaderboard (table).
 */
class Leaderboard {

	/**
	 * Constructor for a leaderboard, given its host url and identifier.
	 */
	constructor(url, name, server, save=true) {
		this.server = server;
		this.url = url;
		this.name = name;
		this.description = null;
		this.refreshCount = -1;
		this.table = {};
		this.date = (new Date(0)).toString();

		if (save) {
			this.save();
		}
	}


	/**
	 * Refreshes the leaderboard's contents.
	 */
	async refresh() {
		this.refreshCount++;

		// Only resolve refresh requests at most every 10s.
		if ((new Date()) - new Date(this.date) < 10000) return false;

		let leaderboards = await scraper.get(this.url);

		// TODO: reformat this for the love of god.
		let request = new Promise((resolve, reject) => {
			http.get(this.url).on("response", async response => {
				response.setEncoding("utf8");
				let body = "";	// Text file.

				response.on("data", chunk => {
					body += chunk;
				});

				response.on("end", () => {
					let lines = body.split("\n");
					let names = lines.filter(line => line.startsWith(`\t<h2 class="content-subhead"> Leaderboard: `))
						.map(line => line.slice(`\t<h2 class="content-subhead"> Leaderboard: `.length));

					this.table = leaderboards[names.indexOf(this.name)];

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
	 * Sets a description for the leaderboard.
	 *
	 * (Because doing it manually is easier than extracting it from the html.)
	 */
	setDescription(description) {
		// TODO: account for character limit.
		this.description = description;

		this.save();
	}

	/**
	 * Turn the leaderboard into multiple message embeds to send.
	 */
	toEmbeds(targetColumn) {
		const Discord = require("discord.js");

		let date = new Date();
		let embedList = [];
		let embed = new Discord.MessageEmbed()
			.setColor(0x00ff00);
		embed.setTitle(`Leaderboard ${this.name}`)
			.setURL(this.url)
			.setFooter(this.name)
			.setTimestamp(date);
		if (this.description !== null) {
			embed.setDescription(this.description);
		}
		embed.addFields(
			{ name: "Pos", value: "\u200B", inline: true },
			{ name: "Team", value: "\u200B", inline: true },
			{ name: targetColumn, value: "\u200B", inline: true }
		);

		let fieldCount = 1;
		let i = 1;
		for (let entry of this.table) {
			// Create new embed if the current one is full:
			if (fieldCount % 8 === 0) {
				embedList.push(embed);
				embed = new Discord.MessageEmbed()
					.setDescription(this.description)
					.setColor(0x00ff00)
					.setFooter(this.name)
					.setTimestamp(date);
			}

			// Add Reference:
			if (entry["Pos"] == "") {
				embed.addFields(
					{ name: "\u200B", value: "\u200B", inline: true },
					{ name: "\u200B", value: entry["Program"], inline: true },
					{ name: "\u200B", value: entry[targetColumn], inline: true }
				);
			// Add team's program:
			} else {
				embed.addFields(
					{ name: "\u200B", value: entry["Pos"], inline: true },
					{ name: "\u200B", value: entry["User"], inline: true },
					{ name: "\u200B", value: entry[targetColumn], inline: true }
				);
			}

			fieldCount++;
		}
		embedList.push(embed);

		return embedList;
	}

	/**
	 * Saves the leaderboard as a JSON file.
	 *
	 * Leaderboards are saved as /guild/<guild_id>/<leaderboard_name>.json
	 */
	save() {
		// Write as JSON:
		fs.writeFileSync(`./guilds/${this.server}/${this.name}.json`, JSON.stringify(this, null, 2));
	}

	/**
	 * Retrieves a team from a JSON file and returns it.
	 */
	static fromJSON(json) {
		return Object.assign(new Leaderboard("http://www.some-fake-url.com", "Tabla de líderes", -1, false), json);
	}
}

module.exports = Leaderboard;
