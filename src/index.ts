// Imports
import { SapphireClient } from '@sapphire/framework';
import mongoose from 'mongoose';
import winston from 'winston';
import LokiTransport from 'winston-loki';
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

// Logger
const myFormat = winston.format.printf(({
	level, message, label, timestamp,
}) => `${timestamp} ${label ? `[${label}]` : ''} ${level}: ${message}`);

export const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.splat(),
				winston.format.timestamp(),
				winston.format.cli(),
				myFormat,
			),
			level: config.logTransports?.console?.level ?? 'info',
		}),
	],
});

if (config.logTransports?.loki) {
	logger.add(new LokiTransport({
		host: config.logTransports.loki.host,
		level: config.logTransports.loki.level ?? 'info',
		labels: { service: 'invite-blacklister' },
	}));
	logger.debug('Added Loki transport');
}

// Mongoose
mongoose.createConnection(`mongodb+srv://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.database}`);

// Discord client
export const client = new SapphireClient({ intents: ['GUILDS', 'GUILD_MESSAGES'] });

client.on('ready', () => {
	logger.info(`Bot started, running: ${process.env.COMMIT_SHA ?? 'unknown'}`);

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
