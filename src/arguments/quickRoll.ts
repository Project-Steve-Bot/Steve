import { Argument } from '@sapphire/framework';
import type { WithId } from 'mongodb';
import type { QuickRoll } from '@lib/types/database';

export class QuickRollArgument extends Argument<WithId<QuickRoll>> {

	public async run(parameter: string, context: Argument.Context) {
		const quickRoll = await this.container.db.quickRolls.findOne({
			user: context.message.author.id,
			rollName: parameter.toLowerCase()
		});

		if (!quickRoll) {
			return this.error({
				context,
				parameter,
				message: `Quick roll \`${parameter}\` does not exist.`,
				identifier: 'NonexistentRoll'
			});
		}

		return this.ok(quickRoll);
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		quickRoll: WithId<QuickRoll>;
	}
}
