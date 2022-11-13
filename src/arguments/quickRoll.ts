import { Argument } from '@sapphire/framework';
import type { WithId } from 'mongodb';
import type { QuickRoll } from '@lib/types/database';
import { resolveQuickRoll } from '@lib/resolvers';

export class QuickRollArgument extends Argument<WithId<QuickRoll>> {

	public async run(parameter: string, context: Argument.Context): Argument.AsyncResult<WithId<QuickRoll>> {
		const resolved = await resolveQuickRoll(parameter, context.message.author);
		return resolved.mapErrInto(identifier => this.error({
			parameter,
			identifier,
			message: `Quick roll \`${parameter}\` does not exist.`,
			context
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		quickRoll: WithId<QuickRoll>;
	}
}
