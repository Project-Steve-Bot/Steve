import { Argument } from '@sapphire/framework';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveRollSpec } from '../lib/resolvers';

export class RollSpecArgument extends Argument<RollSpec[][]> {

	public run(parameter: string, context: Argument.Context) {
		const resolved = resolveRollSpec(parameter);
		return resolved.mapErrInto(error => this.error({
			...error,
			parameter,
			context
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		rollSpec: RollSpec[][];
	}
}
