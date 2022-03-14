import type { CommandInteraction, Invite } from 'discord.js';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import * as Sentry from '@sentry/node';
import Ban from '../models/Ban';

const config = require('../../config.json');

export class BlacklistCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand({
			name: 'blacklist',
			description: 'Blacklist a server\'s invites',
			options: [
				{
					type: 'STRING',
					name: 'invite',
					description: 'A server invite',
					required: true,
				},
			],
		}, {
			idHints: [config.discord.idHints.blacklist],
		});
	}

	// eslint-disable-next-line consistent-return
	public override async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.guild || !interaction.guildId) return interaction.reply('No guild in the interaction.');
		await interaction.deferReply();

		// Parse the interaction
		const inviteCode = interaction.options.getString('invite', true);

		// Fetch the invite from Discord
		let invite: Invite;
		try {
			invite = await this.container.client.fetchInvite(inviteCode);
		} catch {
			return interaction.editReply('Invalid invite code!');
		}

		if (!invite.guild) return interaction.editReply('Failed to fetch guild from invite');

		// Fetch or create ban in db
		let ban;
		try {
			ban = await Ban.findById(invite.guild.id).exec();
		} catch (err) {
			this.container.logger.error(err);
			Sentry.captureException(err);
			return interaction.editReply('Failed to fetch from the database.');
		}
		if (!ban) {
			ban = new Ban({
				_id: invite.guild.id,
			});
		}

		// Check if the guild has already banned this server
		if (ban.guilds.indexOf(interaction.guildId) !== -1) {
			return interaction.editReply('This server has already been blacklisted.');
		}

		// Update the document with new information
		ban.guilds.push(interaction.guildId);
		ban.lastKnownWorkingInvite = invite.code;
		ban.lastKnownName = invite.guild.name;
		ban.lastUpdate = new Date();

		ban.save((err) => {
			if (err) return interaction.editReply('Failed to blacklist the server. Try again.');
			return interaction.editReply(`Blacklisted the server: ${invite.guild!.name} (${invite.guild!.id})`);
		});
	}
}
