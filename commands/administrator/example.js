const Discord = require("discord.js");

exports.run = async (bot, msg, args) => {
	const embed = new Discord.MessageEmbed()
		.setColor(0x00ff80);

	switch (args[0]) {
		case "aoc":{
			embed.setTitle("lb_mars");

			let i = 1;
			embed.addField(`${i++}.- g08`, 21543);
			embed.addField(`${i++}.- g29`, 19165);
			embed.addField(`Puntuacion_10`, 18125);
			embed.addField(`${i++}.- g24`, 17881);
			embed.addField(`${i++}.- g18`, 16998);
			embed.addField(`${i++}.- g07`, 16966);
			embed.addField(`${i++}.- g01`, 16874);
			embed.addField(`${i++}.- g06`, 16831);
			embed.addField(`${i++}.- g48`, 16758);
			embed.addField(`${i++}.- g42`, 16415);
			embed.addField(`${i++}.- g36`, 16415);

			break;}

		case "mpi":{
			embed.setTitle("mpilb");

			let i = 1;
			embed.addField(`${i++}.- g110`, "27.622s");
			embed.addField(`${i++}.- g304`, "28.743s");
			embed.addField(`${i++}.- g211`, "37.412s");
			embed.addField(`${i++}.- g302`, "38.259s");
			embed.addField(`Ref2`, "39.795s");
			embed.addField(`${i++}.- g205`, "40.535s");
			embed.addField(`${i++}.- g107`, "40.698s");
			embed.addField(`${i++}.- g106`, "40.946s");
			embed.addField(`Ref1`, "45.756s");
			embed.addField(`${i++}.- g210`, "49.063s");
			embed.addField(`${i++}.- g206`, "49.644s");
			embed.addField(`${i++}.- g109`, "50.208s");
			embed.addField(`${i++}.- g204`, "51.203s");

			break;}

		case "cuda":{
			embed.setTitle("cudalb");

			let i = 1;
			embed.addField(`${i++}.- g110`, "5.228s");
			embed.addField(`${i++}.- g304`, "6.743s");
			embed.addField(`${i++}.- g109`, "6.770s");
			embed.addField(`${i++}.- g210`, "6.966s");
			embed.addField(`${i++}.- g211`, "7.259s");
			embed.addField(`${i++}.- g302`, "7.285s");
			embed.addField(`${i++}.- g205`, "15.731s");
			embed.addField(`${i++}.- g207`, "16.846s");
			embed.addField(`${i++}.- g206`, "20.420s");
			embed.addField(`${i++}.- g107`, "23.129s");
			embed.addField(`${i++}.- g202`, "26.134s");
			embed.addField(`Ref2`, "26.945s");
			embed.addField(`${i++}.- g102`, "27.975s");
			embed.addField(`${i++}.- g104`, "33.833s");
			embed.addField(`Ref1`, "42.602s");
			embed.addField(`${i++}.- g209`, "42.602s");
			embed.addField(`${i++}.- g106`, "53.379s");
			embed.addField(`${i++}.- g105`, "54.609s");
			embed.addField(`${i++}.- g201`, "54.885s");

			break;}
	}

	msg.reply(embed);
}
