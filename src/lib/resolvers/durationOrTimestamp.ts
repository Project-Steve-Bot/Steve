import { Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import { resolveDuration } from './duration';
import { resolveTimestamp } from './timestamp';
import { DateTime, Duration } from 'luxon';

export async function resolveDurationOrTimestamp(parameter: string, user: User): Promise<Result<Duration|DateTime, 'InvalidDurationOrTimestamp' | 'UnknownFormat'>> {
	const timestampResult = await resolveTimestamp(parameter, user);
	if (timestampResult.isOk()) {
		return Result.ok(timestampResult.unwrap());
	}

	const durationResult = resolveDuration(parameter);
	if (durationResult.isOk()) {
		return Result.ok(durationResult.unwrap());
	}

	if (timestampResult.err().unwrap() === 'UnknownFormat') {
		return Result.err('UnknownFormat');
	}

	return Result.err('InvalidDurationOrTimestamp');
}
