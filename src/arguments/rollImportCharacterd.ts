import { Argument } from '@sapphire/framework';
import type { WithId } from 'mongodb';
import type { RollImportCharacter } from '@lib/types/database';
import { resolveRollImportCharacter } from '@lib/resolvers';

export class QuickRollArgument extends Argument<WithId<RollImportCharacter>> {

	public async run(parameter: string, context: Argument.Context): Argument.AsyncResult<WithId<RollImportCharacter>> {
		const resolved = await resolveRollImportCharacter(parameter, context.message.author);
		return resolved.mapErrInto(error => this.error({
			...error,
			parameter,
			context
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		rollImportCharacter: WithId<RollImportCharacter>;
	}
}
