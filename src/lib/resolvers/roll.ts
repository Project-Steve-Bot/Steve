import { Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveQuickRoll } from './quickRolls';
import { resolveRollSpec } from './rollSpec';
import type { ResolverError } from '../types/resolverError';

export async function resolveRoll(parameter: string, user: User): Promise<Result<RollSpec[][], ResolverError>> {
	const resolvedQR = await resolveQuickRoll(parameter, user);
	if (resolvedQR.isOk()) {
		return Result.ok(resolvedQR.unwrap().specs);
	}

	const resolvedSpec = resolveRollSpec(parameter);
	if (resolvedSpec.isOk()) {
		return resolvedSpec;
	}

	return Result.err({
		identifier: 'InvalidQuickRollOrSpec',
		message: `\`${parameter}\` is not a valid quick roll or spec.`
	});
}
