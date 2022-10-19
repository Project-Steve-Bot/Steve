import { Argument } from '@sapphire/framework';
import type { RollSpecArgument } from '@root/src/arguments/rollSpec';
import type { QuickRollArgument } from '@root/src/arguments/quickRoll';
import type { RollSpec } from '@lib/types/rollSpec';

export class DurationOrTimestampArgument extends Argument<RollSpec[][]> {

	public async run(parameter: string, context: Argument.Context) {
		const quickRollArg = this.container.stores.get('arguments').get('quickRoll') as QuickRollArgument;
		const rollSpecArg = this.container.stores.get('arguments').get('rollSpec') as RollSpecArgument;

		if (!quickRollArg || !rollSpecArg) {
			return this.error({
				context,
				parameter,
				message: 'Internal Error.',
				identifier: 'QuickRollOrRollSpecArgNotFound'
			});
		}

		const quickRollResult = await quickRollArg.run(parameter, context);

		if (quickRollResult.isOk()) {
			return this.ok(quickRollResult.unwrap().specs);
		}

		const rollSpecResult = rollSpecArg.run(parameter, context);

		if (rollSpecResult.isOk()) {
			return rollSpecResult;
		}

		return this.error({
			context,
			parameter,
			message: `${parameter} is not a valid quick roll or spec`,
			identifier: 'InvalidQuickRollOrSpec'
		});
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		roll: RollSpec[][];
	}
}
