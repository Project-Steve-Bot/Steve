import { Argument } from '@sapphire/framework';
import type { DurationArgument } from '@root/src/arguments/duration';
import type { TimestampArgument } from '@root/src/arguments/timestamp';

export class DurationOrTimestampArgument extends Argument<number|Date> {

	public async run(parameter: string, context: Argument.Context) {
		const durationArg = this.container.stores.get('arguments').get('duration') as DurationArgument;
		const timestampArg = this.container.stores.get('arguments').get('timestamp') as TimestampArgument;

		if (!durationArg || !timestampArg) {
			return this.error({
				context,
				parameter,
				message: 'Internal Error.',
				identifier: 'DurationOrTimestampNotFound'
			});
		}

		const timestampResult = await timestampArg.run(parameter, context);

		if (timestampResult.success) {
			return timestampResult;
		}

		const durationResult = await durationArg.run(parameter, context);

		if (durationResult.success) {
			return durationResult;
		}

		return this.error({
			context,
			parameter,
			message: `${parameter} is not a valid duration or timestamp`,
			identifier: 'InvalidDurationOrTimestamp'
		});
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		durationOrTimestamp: number|Date;
	}
}
