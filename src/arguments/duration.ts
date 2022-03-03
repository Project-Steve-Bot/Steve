import { Argument } from '@sapphire/framework';
import parse from 'parse-duration';

export class DurationArgument extends Argument<number> {

	public run(parameter: string, context: Argument.Context) {
		const duration = parse(parameter);

		if (!duration) {
			return this.error({
				context,
				parameter,
				message: `${parameter} is not a valid duration.`,
				identifier: 'InvalidDuration'
			});
		}

		return this.ok(duration);
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		duration: string;
	}
}
