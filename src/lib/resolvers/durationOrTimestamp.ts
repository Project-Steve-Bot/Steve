import { Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import { resolveDuration } from './duration';
import { resolveTimestamp } from './timestamp';

export async function resolveDurationOrTimestamp(parameter: string, user: User): Promise<Result<number|Date, 'InvalidDurationOrTimestamp'>> {
	const timestampResult = await resolveTimestamp(parameter, user);
	if (timestampResult.isOk()) {
		return timestampResult;
	}

	const durationResult = resolveDuration(parameter);
	if (durationResult.isOk()) {
		return durationResult;
	}

	return Result.err('InvalidDurationOrTimestamp');
}
