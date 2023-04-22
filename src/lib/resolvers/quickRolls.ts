import { container, Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import type { WithId } from 'mongodb';
import type { QuickRoll } from '../types/database';
import type { ResolverError } from '../types/resolverError';

export async function resolveQuickRoll(parameter: string, user: User): Promise<Result<WithId<QuickRoll>, ResolverError>> {
	const quickRoll = await container.db.quickRolls.findOne({
		user: user.id,
		rollName: parameter.toLowerCase(),
		active: true
	});

	if (!quickRoll) {
		return Result.err({ identifier: 'NonexistentRoll', message: `\`${parameter}\` is not a valid quick roll.` });
	}

	return Result.ok(quickRoll);
}
