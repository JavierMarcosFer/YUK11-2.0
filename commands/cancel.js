const { SlashCommandBuilder } = require('discord.js');
const shuffle = require('../shuffle-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancel')
		.setDescription('Remove your submission from an upcoming shuffle.'),
	async execute(interaction) {
		await interaction.deferReply();

		shuffle.cancelSubmission(interaction, interaction.user.id);
	},
};