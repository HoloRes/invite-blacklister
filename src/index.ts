// Imports
import '@sapphire/plugin-logger/register';
import { SapphireClient } from '@sapphire/framework';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import rootDir from './root';

// Config
// eslint-disable-next-line import/order
const config = require('../config.json');

// Sentry
if (config.sentryDsn) {
	Sentry.init({
		dsn: config.sentryDsn,
		integrations: [
			new RewriteFrames({
				root: rootDir,
			}),
		],
	});
}

// Mongoose
mongoose.createConnection(`mongodb+srv://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.database}`);

// Discord client
const client = new SapphireClient({ intents: ['GUILDS', 'GUILD_MESSAGES'] });

client.once('ready', (container) => {
	container.logger.info(`Bot started, running: ${process.env.COMMIT_SHA ?? 'unknown'}`);

	// Show commit SHA in playing status when not in production
	if (process.env.ENVIRONMENT !== 'production') {
		client.user!.setPresence({
			activities: [{
				name: `version: ${process.env.COMMIT_SHA?.substring(0, 7) ?? 'unknown'}`,
				type: 'PLAYING',
			}],
		});
	}
});

client.login(config.discord.authToken);
