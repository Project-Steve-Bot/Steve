import { container, Result } from '@sapphire/framework';
import type { User } from 'discord.js';

const timeRegex = /^([012]?\d:\d\d) ?([ap]m)?/i;
const indicatorRegex = /[ap]m/i;

export async function resolveTimestamp(parameter: string, user: User): Promise<Result<Date, 'TimestampNullMatch' | 'InvalidDateTime'>> {
	if (timeRegex.test(parameter)) {
		const match = parameter.match(timeRegex);
		if (!match) {
			return Result.err('TimestampNullMatch');
		}
		parameter = `${new Date().toDateString()} ${match[1]} ${match[2] ?? ''}`;
	}

	const dbUser = await container.db.users.findOne({ id: user.id });

	const timestamp = new Date(`${parameter.replace(indicatorRegex, indicator => ` ${indicator}`)}${dbUser?.timezone ? dbUser.timezone : ''}`);

	if (timestamp.toString() === 'Invalid Date') {
		return Result.err('InvalidDateTime');
	}

	return Result.ok(timestamp);
}
