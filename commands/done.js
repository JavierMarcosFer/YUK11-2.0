const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('done')
		.setDescription('Turn in a completed prompt.')
		.addAttachmentOption(option =>
			option.setName('attachment')
				.setDescription('Something cool based on your assigned character!')
				.setRequired(false),
		)
		.addStringOption(option =>
			option.setName('link')
				.setDescription('A link works fine too.')
				.setRequired(false),
		),
	async execute(interaction) {
		await interaction.reply('It\'s ovah!');
	},
};