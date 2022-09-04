const { SlashCommandBuilder } = require('discord.js');
const shuffle = require('../shuffle-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sffl')
		.setDescription('Submit a character to enter the weekly shuffle.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Name of your character.')
				.setRequired(true),
		)
		.addAttachmentOption(option =>
			option.setName('image')
				.setDescription('Colored, full-body image of your submitted character.')
				.setRequired(false),
		)
		.addStringOption(option =>
			option.setName('link')
				.setDescription('A link to it works fine too.')
				.setRequired(false),
		),
	async execute(interaction) {
		await interaction.deferReply();
		shuffle.addSubmission(interaction, interaction.user.id);
		return;
	},
};
