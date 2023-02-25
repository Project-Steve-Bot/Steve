import { Result } from '@sapphire/framework';
import parse from 'parse-duration';

export function resolveDuration(parameter: string): Result<number, 'InvalidDuration'> {
	const duration = parse(parameter);

	if (!duration) {
		return Result.err('InvalidDuration');
	}

	return Result.ok(duration);
}
