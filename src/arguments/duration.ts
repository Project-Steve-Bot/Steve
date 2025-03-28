import { Argument } from '@sapphire/framework';
import { resolveDuration } from '@lib/resolvers';
import { Duration } from 'luxon';

export class DurationArgument extends Argument<Duration> {

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
		duration: Duration;
	}
}
