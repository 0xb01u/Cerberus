const fs = require("fs");

const Team = require("../objects/Team.js");

/**
 * Student data and preferences object.
 */
class Student {
	/**
	 * Constructor for a student, given a server they are in.
	 *
	 * Every student must be in at least one server. (It wouldn't make sense
	 * if they weren't.)
	 */
	constructor(userID, serverName, username, userNo, save=true) {
		this.id = userID;
		this.username = `${username}#${userNo}`

		let guildMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));
		let serverID = guildMap[serverName];

		this.preferredServer = serverID;
		this.guilds = [serverID];
		this.credentials = {};
		this.preferredQueue = null;
		this.latestClientCommand = null;
		this.aliases = {};
		this.aliases[serverName] = serverID;

		if (save) this.save();
	}

	/**
	 * Adds a guild to the list of guilds this student is in.
	 */
	addServer(serverName) {
		let guildMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));
		let serverID = guildMap[serverName];

		if (this.guilds.includes(serverID)) {
			// TODO: handle this exception.
			return;
		}

		this.guilds.push(serverID);
		this.aliases[serverName] = serverID;

		this.save();
	}

	/**
	 * Adds the password for a server the student is in.
	 */
	addPassword(serverID, password) {
		if (!(serverID in this.credentials)) {
			// TODO: handle this exception.
			return;
		}

		this.credentials[serverID].passwd = password;

		this.save();
	}

	/**
	 * Adds a team for one of the guilds this student is in.
	 */
	addTeam(serverID, teamID) {
		if (!this.guilds.includes(serverID)) {
			this.addServer(serverID);
		}

		let team = global.getTeam(teamID, serverID);
		this.credentials[serverID] = {"team": teamID, "passwd": team.passwd};

		this.save();
	}

	/**
	 * Removes the team for one of the guilds this student is in.
	 *
	 * The removed team is probably not confirmed (definitive),
	 * so their members could join and leave at will.
	 */
	removeTeam(serverID) {
		if (!this.guilds.includes(serverID)) {
			// TODO: handle this exception.
			return;
		}
		delete this.credentials[serverID];

		this.save();
	}

	/**
	 * Sets the preferred server of the student.
	 */
	setServer(serverID) {
		if (!this.guilds.includes(serverID)) {
			// TODO: handle this exception.
			return;
		}

		this.preferredServer = serverID;

		this.save();
	}

	/**
	 * Sets the preferred queue of the student.
	 */
	setQueue(queue) {
		this.preferredQueue = queue;

		this.save();
	}

	/**
	 * Sets the latest queue command used by the student.
	 */
	setCommand(cmd) {
		this.latestClientCommand = cmd;

		this.save();
	}

	/**
	 * Adds an alias for a server name.
	 */
	addAlias(serverName, alias) {
		let serverID = this.aliases[serverName];

		aliases[alias] = serverID;

		this.save();
	}

	/**
	 * Saves the student's information as a JSON file.
	 *
	 * Students are saved as /users/username#discriminator.json, for readability.
	 */ 
	save() {
		if (!fs.existsSync(`./users/`)) fs.mkdirSync(`./users/`);
		// TODO: account for name changes.
		fs.writeFileSync(`./users/${this.id}.json`, JSON.stringify(this, null, 2));
	}

	/**
	 * Retrieves a student from a JSON file and returns it.
	 */
	static fromJSON(json) {
		return Object.assign(new Student(0, -1, "B0luWasHere", 1337, false), json);
	}
}

module.exports = Student;
