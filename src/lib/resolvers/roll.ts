import { Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveQuickRoll } from './quickRolls';
import { resolveRollSpec } from './rollSpec';

export async function resolveRoll(parameter: string, user: User): Promise<Result<RollSpec[][], 'InvalidQuickRollOrSpec'>> {
	const resolvedQR = await resolveQuickRoll(parameter, user);
	if (resolvedQR.isOk()) {
		return Result.ok(resolvedQR.unwrap().specs);
	}

	const resolvedSpec = resolveRollSpec(parameter);
	if (resolvedSpec.isOk()) {
		return resolvedSpec;
	}

	return Result.err('InvalidQuickRollOrSpec');
}
