import { Argument } from '@sapphire/framework';
import { resolveDuration } from '@lib/resolvers';

export class DurationArgument extends Argument<number> {

	public run(parameter: string, context: Argument.Context) {
		const resolved = resolveDuration(parameter);
		return resolved.mapErrInto(identifier => this.error({
			context,
			parameter,
			message: `${parameter} is not a valid duration.`,
			identifier
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		duration: number;
	}
}
