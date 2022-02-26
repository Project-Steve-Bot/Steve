import { container } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed, User } from 'discord.js';
import type { WithId } from 'mongodb';
import { RandomLoadingMessage } from './constants';
import type { Reminder } from './types/database';

export function pickRandom<T>(array: readonly T[]): T {
	const { length } = array;
	return array[Math.floor(Math.random() * length)];
}

export function sendLoadingMessage(message: Message): Promise<typeof message> {
	return send(message, {
		embeds: [
			new MessageEmbed()
				.setDescription(pickRandom(RandomLoadingMessage))
				.setColor('#FF0000')
		]
	});
}

export type TimestampType = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export function dateToTimestamp(date: Date, type: TimestampType = 't'): String {
	return `<t:${Math.round(date.valueOf() / 1e3)}:${type}>`;
}

export async function getUserReminders(user: User): Promise<WithId<Reminder>[]> {
	const reminders = await container.client.db.reminder.find({ user: user.id }).toArray();
	return reminders.sort((a, b) => a.expires.valueOf() - b.expires.valueOf());
}
