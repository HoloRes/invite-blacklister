import type { CommandInteraction, Invite } from 'discord.js';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import * as Sentry from '@sentry/node';
import { SnowflakeRegex } from '@sapphire/discord.js-utilities';
import Ban from '../models/Ban';

const config = require('../../config.json');

export class UnblacklistCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand({
			name: 'unblacklist',
			description: 'Unblacklist a server\'s invites',
			options: [
				{
					type: 'STRING',
					name: 'resolvable',
					description: 'A server resolvable (invite or server id)',
					required: true,
				},
			],
		}, {
			idHints: [config.discord.idHints.unblacklist],
		});
	}

	// eslint-disable-next-line consistent-return
	public override async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.guild || !interaction.guildId) return interaction.reply('No guild in the interaction.');
		if (!interaction.memberPermissions!.has('MANAGE_MESSAGES')) return interaction.reply('You lack permissions to run this command.');
		await interaction.deferReply();

		// Parse the interaction
		const resolvable = interaction.options.getString('resolvable', true);

		let ban;

		// CHeck if it's a snowflake
		if (SnowflakeRegex.test(resolvable)) {
			try {
				ban = await Ban.findById(resolvable).exec();
			} catch (err) {
				this.container.logger.error(err);
				Sentry.captureException(err);
				return interaction.editReply('Failed to fetch from the database.');
			}
		} else {
			// Fetch the invite from Discord
			let invite: Invite;
			try {
				invite = await this.container.client.fetchInvite(resolvable);
			} catch {
				return interaction.editReply('Invalid invite code!');
			}

			if (!invite.guild) return interaction.editReply('Failed to fetch guild from invite');

			try {
				ban = await Ban.findById(invite.guild.id).exec();
			} catch (err) {
				this.container.logger.error(err);
				Sentry.captureException(err);
				return interaction.editReply('Failed to fetch from the database.');
			}
		}

		if (!ban) return interaction.editReply('Server not found in database');

		// Check if the guild has already banned this server
		const index = ban.guilds.indexOf(interaction.guildId);
		if (index === -1) {
			return interaction.editReply('This server is not blacklisted.');
		}

		// Update the document with new information
		ban.guilds.splice(index, 1);

		ban.save((err) => {
			if (err) return interaction.editReply('Failed to remove blacklist. Try again.');
			return interaction.editReply('Unblacklisted the server');
		});
	}
}
