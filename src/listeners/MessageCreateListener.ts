import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import run from '../lib/InvitesChecker';

@ApplyOptions<ListenerOptions>({})
export class MessageListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: 'messageCreate',
		});
	}

	public async run(message: Message) {
		return run(message, this.container);
	}
}
