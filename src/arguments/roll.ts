import { Argument } from '@sapphire/framework';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveRoll } from '@lib/resolvers';

export class RollArgument extends Argument<RollSpec[][]> {

	public async run(parameter: string, context: Argument.Context) {
		const resolved = await resolveRoll(parameter, context.message.author);
		return resolved.mapErrInto(identifier => this.error({
			parameter,
			identifier,
			message: `\`${parameter}\` is not a valid quick roll or spec.`,
			context
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		roll: RollSpec[][];
	}
}
