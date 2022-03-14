import mongoose from 'mongoose';

interface Guild {
	_id: string;
	settings: {
		logChannel?: string;
	}
}

const GuildSchema = new mongoose.Schema<Guild>({
	_id: String,
	settings: {
		logChannel: String,
	},
});

export default mongoose.model<Guild>('Guild', GuildSchema, 'guilds');
