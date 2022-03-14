import mongoose from 'mongoose';

interface Ban {
	_id: string;
	guilds: string[];
	lastKnownWorkingInvite: string;
	lastKnownName: string;
	lastUpdate: Date;
}

const BanSchema = new mongoose.Schema<Ban>({
	_id: String,
	guilds: [String],
	lastKnownWorkingInvite: { type: String, required: true },
	lastKnownName: { type: String, required: true },
	lastUpdate: { type: Date, required: true },
});

export default mongoose.model<Ban>('Ban', BanSchema, 'bans');
