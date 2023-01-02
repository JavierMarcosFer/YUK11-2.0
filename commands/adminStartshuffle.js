const { SlashCommandBuilder } = require('discord.js');
const shuffle = require('../shuffle-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('startshuffle')
		.setDescription('Manually start the weekly shuffle.'),
	async execute(interaction) {
		await interaction.deferReply();
		const result = await shuffle.startShuffle(interaction.client);
		if (result == 0) {
			await interaction.followUp('The shuffle has begun!');
		}
		else {
			await interaction.followUp('Oh, something might\'ve gone wrong...');
		}
		return;
	},
};
