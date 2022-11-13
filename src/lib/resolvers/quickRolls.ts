import { container, Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import type { WithId } from 'mongodb';
import type { QuickRoll } from '../types/database';

export async function resolveQuickRoll(parameter: string, user: User): Promise<Result<WithId<QuickRoll>, 'NonexistentRoll'>> {
	const quickRoll = await container.db.quickRolls.findOne({
		user: user.id,
		rollName: parameter.toLowerCase()
	});

	if (!quickRoll) {
		return Result.err('NonexistentRoll');
	}

	return Result.ok(quickRoll);
}
