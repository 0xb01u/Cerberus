const fs = require("fs");

const TeamConfirmation = require("../objects/TeamConfirmation.js")

/**
 * Class defining a team of students that compete in a leaderboard.
 */
class Team {
	/**
	 * Constructor for a team given as its identifier.
	 *
	 * Team IDs must be of the regex form "g\d+" // Temp or definitive?
	 *
	 * The team's name is temporarily set as the identifier.
	 */
	constructor(id, server, save=true) {
		this.id = id;			// Team identifier (immutable).
		this.passwd = null;		// Password for the team (ADMIN-managed).
		this.server = server;	// ID for the server the team belongs to.
		this.name = id;			// Team name (mutable).
		this.members = [];		// Team members.
		this.confirmed = false;	// Whether this team has been confirmed
								// as "closed" (immutable in members)
								// by its members or not.
		if (save) {
			this.save();

			// Add to the server-name map:
			let nameMap = (fs.existsSync(`./teams/${this.server}/nameMap.json`)) ? JSON.parse(fs.readFileSync(`./teams/${this.server}/nameMap.json`)) : {};
			nameMap[id] = this.name;
			fs.writeFileSync(`./teams/${this.server}/nameMap.json`, JSON.stringify(nameMap));
		}
	}

	/**
	 * Adds the given user to the team, unless the team is already full.
	 *
	 * Team capacity must have been set as an environmental variable
	 * beforehand.
	 */
	join(userID) {
		if (this.confirmed) {
			// TODO: handle this exception.
			return false;
		}

		this.members.push(userID);

		global.getStudent(userID).addTeam(this.server, this.id);

		// If the team gets completely filled, close and confirm the team.
		if (this.members.length == process.env.TEAM_CAPACITY) {
			this.confirmed = true;
		}

		this.save();

		return true;
	}

	/**
	 * Requests, as the given user, to join the server.
	 *
	 * If the team already has at least one member, a bot client
	 * must be passed. This will be the bot client that will send the
	 * confirmation request to the other team members.
	 */
	request(userID, middlebot=null) {
		if (members.length === 0) {
			return this.join(userID);
		} else {
			if (this.confirmed) {
				return false;
			}
			if (middlebot == null) {
				// TODO: handle this exception.
				return false;
			}
			let req = new TeamConfirmation(this, userID);
			return req.sendRequest(bot);
		}
	}

	/**
	 * Changes the team's name, for customization purposes.
	 */
	changeName(newName) {
		// The name cannot be a different ID:
		if (/^g\d+/.test(newName)) {
			// TODO: handle this exception.
			return;
		}

		// The name cannot be the same as another team's name:
		nameMap = (fs.existsSync(`./teams/${this.server}/nameMap.json`)) ?
		JSON.parse(fs.readFileSync(`./teams/${this.server}/nameMap.json`)) :
		{};
		if (Object.values(nameMap).includes(newName)) {
			// TODO: handle this exception.
			return;
		}

		this.name = newName;
		// Update the server-name map:
		nameMap[id] = this.name;
		fs.writeFileSync(`./teams/${this.server}/nameMap.json`, JSON.stringify(nameMap));

		this.save();
	}

	/**
	 * Sets the password for the team.
	 */
	setPassword(passwd) {
		if (this.passwd === null) {
			console.log(this.id, passwd);
			this.passwd = passwd;

			for (let member of this.members) {
				let student = global.getStudent(member);

				student.addPassword(this.server, this.passwd);
			}

			this.save();
		} else {
			// TODO: handle this exception.
		}
	}

	/**
	 * Deletes the given user from the team.
	 */
	leave(userID) {
		if (!this.members.includes(userID)) {
			// TODO: handle this exception.
			return false;
		}

		this.members.splice(this.members.indexOf(userID), 1);

		global.getStudent(userID).removeTeam(this.server);

		this.save();

		if (this.members.length === 0) this.delete();

		return true;
	}

	/**
	 * Unconfirms the team, so it becomes mutable again.
	 */
	unconfirm() {
		this.confirmed = false;

		this.save();
	}

	/**
	 * Deletes this team from the system.
	 */
	delete() {
		// Delete the team JSON and all its pending confirmations.
		for (let file of fs.readdirSync(`./teams/${this.server}`)) {
			if (file.startsWith(this.id)) {
				fs.unlinkSync(`./teams/${this.server}/${file}`)
			}
		}
	}

	/**
	 * Saves the team as a JSON file.
	 *
	 * Teams are saved as /teams/<guild_id>/<team_id>.json
	 */
	save() {
		// Create directories if they don't exist:
		//  - Done on team.js -

		// Write as JSON:
		fs.writeFileSync(`./teams/${this.server}/${this.id}.json`, JSON.stringify(this));
	}

	/**
	 * Retrieves a team from a JSON file and returns it.
	 */
	// TODO: control when things are saved, instead of saving every time
	// a function is executed?
	static fromJSON(json) {
		return Object.assign(new Team("g110", -1, false), json);
	}
}

module.exports = Team;
