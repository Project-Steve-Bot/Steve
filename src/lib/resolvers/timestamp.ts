import { container, Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import { DateTime } from 'luxon';

const timeRegex = /^([012]?\d:\d\d) ?([ap]m)?/i;
const indicatorRegex = /[ap]m/i;

export async function resolveTimestamp(parameter: string, user: User): Promise<Result<DateTime, 'TimestampNullMatch' | 'InvalidDateTime' | 'UnknownFormat'>> {
	const dbUser = await container.db.users.findOne({ id: user.id });

	if (dbUser?.dateTimeFormats && dbUser.dateTimeFormats.length > 0) {
		for (const format of dbUser.dateTimeFormats) {
			const potentialTimestamp = DateTime.fromFormat(parameter, format, {
				zone: dbUser.timezone
			});

			if (potentialTimestamp.isValid) {
				return Result.ok(potentialTimestamp);
			}
		}

		return Result.err('UnknownFormat');
	}

	if (timeRegex.test(parameter)) {
		const match = parameter.match(timeRegex);
		if (!match) {
			return Result.err('TimestampNullMatch');
		}
		parameter = `${new Date().toDateString()} ${match[1]} ${match[2] ?? ''}`;
	}

	const timestamp = new Date(`${parameter.replace(indicatorRegex, indicator => ` ${indicator}`)}${dbUser?.timezone ?? ''}`);

	if (timestamp.toString() === 'Invalid Date') {
		return Result.err('InvalidDateTime');
	}

	return Result.ok(DateTime.fromJSDate(timestamp));
}
