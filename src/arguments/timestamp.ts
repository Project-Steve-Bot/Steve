import { Argument } from '@sapphire/framework';
import { resolveTimestamp } from '@lib/resolvers';

export class TimestampArgument extends Argument<Date> {

	public async run(parameter: string, context: Argument.Context) {
		const resolved = await resolveTimestamp(parameter, context.message.author);
		return resolved.mapErrInto(identifier => this.error({
			context,
			parameter,
			message: `${parameter} is not a valid date time`,
			identifier
		}));
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		timestamp: Date;
	}
}
