const { SlashCommandBuilder } = require('discord.js');
const shuffle = require('../shuffle-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('startshuffle')
		.setDescription('Manually start the weekly shuffle.'),
	async execute(interaction) {
		await interaction.deferReply();
		shuffle.startShuffle();
		return;
	},
};
