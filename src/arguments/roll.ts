import { Argument } from '@sapphire/framework';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveRoll } from '@lib/resolvers';

export class RollArgument extends Argument<RollSpec[][]> {

	public async run(parameter: string, context: Argument.Context) {
		const resolved = await resolveRoll(parameter, context.message.author);
		return resolved.mapErrInto(error => this.error({
			...error,
			parameter,
			context
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		roll: RollSpec[][];
	}
}
