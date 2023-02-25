import { Argument } from '@sapphire/framework';
import { resolveDurationOrTimestamp } from '@lib/resolvers';

export class DurationOrTimestampArgument extends Argument<number|Date> {

	public async run(parameter: string, context: Argument.Context) {
		const resolved = await resolveDurationOrTimestamp(parameter, context.message.author);
		return resolved.mapErrInto(identifier => this.error({
			context,
			parameter,
			message: `${parameter} is not a valid duration or timestamp`,
			identifier
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		durationOrTimestamp: number|Date;
	}
}
