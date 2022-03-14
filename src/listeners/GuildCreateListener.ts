import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import type { Guild as DiscordGuild } from 'discord.js';
import * as Sentry from '@sentry/node';
import Guild from '../models/Guild';

@ApplyOptions<ListenerOptions>({})
export class MessageListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildCreate',
		});
	}

	public async run(guild: DiscordGuild) {
		const guildDoc = new Guild({
			_id: guild.id,
			settings: {},
		});

		guildDoc.save((err) => {
			this.container.logger.error(err);
			Sentry.captureException(err);
		});
	}
}
