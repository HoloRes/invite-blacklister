import type { CommandInteraction } from 'discord.js';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import * as Sentry from '@sentry/node';
import Guild from '../models/Guild';

const config = require('../../config.json');

export class SetLogChannelCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand({
			name: 'setlogchannel',
			description: 'Set the logging channel',
			options: [
				{
					type: 'CHANNEL',
					name: 'channel',
					description: 'A guild channel',
					required: true,
				},
			],
		}, {
			idHints: [config.discord.idHints.setlogchannel],
		});
	}

	// eslint-disable-next-line consistent-return
	public override async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.guild || !interaction.guildId) return interaction.reply({ content: 'No guild in the interaction.', ephemeral: true });
		if (!interaction.memberPermissions!.has('MANAGE_MESSAGES')) return interaction.reply({ content: 'You lack permissions to run this command.', ephemeral: true });
		await interaction.deferReply({ ephemeral: true });

		// Parse the interaction
		const channel = interaction.options.getChannel('channel', true);

		// Find guild in database;
		let guild;
		try {
			guild = await Guild.findById(interaction.guildId).exec();
		} catch (err) {
			this.container.logger.error(err);
			Sentry.captureException(err);
			return interaction.editReply('Failed to fetch guild from database. Try again.');
		}

		if (!guild) {
			guild = new Guild({
				_id: interaction.guildId,
				settings: {},
			});
		}

		guild.settings.logChannel = channel.id;

		guild.save((err) => {
			if (err) return interaction.editReply('Failed to save settings. Try again.');
			return interaction.editReply(`Set new logging channel to **${channel.name}**.`);
		});
	}
}
