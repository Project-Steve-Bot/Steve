import { Argument } from '@sapphire/framework';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveRollSpec } from '../lib/resolvers';

export class RollSpecArgument extends Argument<RollSpec[][]> {

	public run(parameter: string, context: Argument.Context) {
		const resolved = resolveRollSpec(parameter);
		return resolved.mapErrInto(identifier => this.error({
			parameter,
			identifier,
			message: `\`${parameter}\` is not a valid spec.`,
			context
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		rollSpec: RollSpec[][];
	}
}
