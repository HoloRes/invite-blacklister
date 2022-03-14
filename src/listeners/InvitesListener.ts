import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { DiscordInviteLinkRegex } from '@sapphire/discord.js-utilities';
import * as Sentry from '@sentry/node';
import type { Message } from 'discord.js';
import { Formatters, MessageEmbed, TextChannel } from 'discord.js';
import Ban from '../models/Ban';
import Guild from '../models/Guild';

@ApplyOptions<ListenerOptions>({})
export class MessageListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: 'messageCreate',
		});
	}

	public async run(message: Message) {
		if (!message.guildId) return;

		const split = message.content.split(' ');

		const guild = await Guild.findById(message.guildId).exec()
			.catch((err) => {
				Sentry.captureException(err);
			});

		let channel: TextChannel | undefined;

		if (guild && guild.settings.logChannel) {
			channel = await this.container.client.channels.fetch(guild.settings.logChannel)
				.catch((err: Error) => {
					Sentry.captureException(err);
				}) as TextChannel;
		}

		// eslint-disable-next-line no-restricted-syntax
		for (const text of split) {
			if (DiscordInviteLinkRegex.test(text)) {
				const { code } = text.match(DiscordInviteLinkRegex)!.groups!;

				// eslint-disable-next-line no-await-in-loop
				const invite = await this.container.client.fetchInvite(code)
					.catch(() => {});

				if (invite?.guild) {
					// eslint-disable-next-line no-await-in-loop
					const ban = await Ban.findById(invite.guild.id).exec()
						.catch((err) => {
							Sentry.captureException(err);
						});

					if (ban && ban.guilds.indexOf(message.guildId) !== -1) {
						if (channel) {
							const embed = new MessageEmbed()
								.setTitle('Invite match found')
								.setDescription(`Found invite of: ${ban.lastKnownName} (${ban._id})`)
								.addField('Message', Formatters.codeBlock(message.content))
								.setColor('#ff6600')
								.setTimestamp();

							// eslint-disable-next-line no-await-in-loop
							await channel.send({ embeds: [embed] });
						}

						// eslint-disable-next-line no-await-in-loop
						await message.delete()
							.catch(async () => {
								if (channel) {
									const failEmbed = new MessageEmbed()
										.setTitle('Failed to delete message')
										.setDescription(`Failed to delete [message](${message.url}), this could be due to missing permissions`)
										.setColor('#ff0000')
										.setTimestamp();

									await channel.send({ embeds: [failEmbed] });
								}
							});
					}
				}
			}
		}
	}
}
