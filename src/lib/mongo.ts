import { Collection, MongoClient } from 'mongodb';
import { container } from '@sapphire/framework';
import type { Reminder, DbGuild, DbUser, Poll, Snippet, CmdStats, ChannelRename, QuickRoll } from '@lib/types/database';

export interface SteveCollections {
	reminder: Collection<Reminder>;
	guilds: Collection<DbGuild>;
	users: Collection<DbUser>;
	polls: Collection<Poll>;
	snips: Collection<Snippet>;
	cmdStats: Collection<CmdStats>;
	channelRename: Collection<ChannelRename>;
	quickRolls: Collection<QuickRoll>
}

export async function startMongo() {
	if (!process.env.MONGO_CONNECTION) {
		throw new Error('No database connection string provided.');
	}
	const mongo = new MongoClient(process.env.MONGO_CONNECTION);

	await mongo.connect();

	const database = mongo.db(process.env.BOT_NAME);

	const db: SteveCollections = {
		reminder: database.collection<Reminder>('reminders'),
		guilds: database.collection<DbGuild>('guilds'),
		users: database.collection<DbUser>('users'),
		polls: database.collection<Poll>('polls'),
		snips: database.collection<Snippet>('snippets'),
		cmdStats: database.collection<CmdStats>('commandStats'),
		channelRename: database.collection<ChannelRename>('channelRename'),
		quickRolls: database.collection<QuickRoll>('quickRolls')
	};

	container.mongo = mongo;
	container.db = db;

	console.log('Connected to MongoDB');
}
