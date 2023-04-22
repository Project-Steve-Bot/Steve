import { container, Result } from '@sapphire/framework';
import type { User } from 'discord.js';
import type { WithId } from 'mongodb';
import type { RollImportCharacter } from '../types/database';
import type { ResolverError } from '../types/resolverError';

export async function resolveRollImportCharacter(parameter: string, user: User): Promise<Result<WithId<RollImportCharacter>, ResolverError>> {
	const character = await container.db.rollImportCharacters.findOne({
		user: user.id,
		name: parameter
	});

	if (!character) {
		return Result.err({ identifier: 'NonExistentCharacter', message: `\`${parameter}\` is not an imported character.` });
	}

	return Result.ok(character);
}
