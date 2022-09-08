const { SlashCommandBuilder } = require('discord.js');
const shuffle = require('../shuffle-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addref')
		.setDescription('Submit a character to enter the weekly shuffle.')
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
		shuffle.addReference(interaction, interaction.user.id);
		return;
	},
};