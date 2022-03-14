import type { CommandInteraction } from 'discord.js';
import { Command } from '@sapphire/framework';
import { MessageEmbed, Team, User } from 'discord.js';

const config = require('../../config.json');

export class InfoCommand extends Command {
	public constructor(context: Command.Context) {
		super(context, {
			name: 'info',
			description: 'Bot information',
			chatInputCommand: {
				register: true,
				idHints: [config.discord.idHints.info],
			},
		});
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		await this.container.client.application?.fetch();
		const { owner } = this.container.client.application!;
		let ownerUser: User | undefined | null;

		if (owner instanceof Team) {
			ownerUser = owner.owner?.user;
		} else ownerUser = owner as User;

		const embed = new MessageEmbed()
			.setTitle('Invite blacklist bot')
			.setDescription('A bot to blacklist server invites based on the id.')
			.addField('Source code', '[GitHub](https://github.com/HoloRes/invite-blacklister)');

		if (ownerUser) {
			embed.setAuthor({ name: `Created by: ${ownerUser.tag}`, iconURL: ownerUser.avatarURL() ?? undefined });
		}
		if (config.info.donateService && config.info.donateUrl) {
			embed.addField('Donate', `[${config.info.donateService}](${config.info.donateUrl})`);
		}

		await interaction.reply({ embeds: [embed] });
	}
}
