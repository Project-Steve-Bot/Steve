import { Argument } from '@sapphire/framework';

export class TimestampArgument extends Argument<Date> {

	private timeRegex = /^([012]?\d:\d\d) ?([ap]m)?/i;
	private indicatorRegex = /[ap]m/i;

	public async run(parameter: string, context: Argument.Context) {
		if (this.timeRegex.test(parameter)) {
			const match = parameter.match(this.timeRegex);
			if (!match) {
				return this.error({
					parameter,
					context,
					identifier: 'TimestampNullMatch'
				});
			}
			parameter = `${new Date().toDateString()} ${match[1]} ${match[2] ?? ''}`;
		}

		const dbUser = await this.container.db.users.findOne({ id: context.message.author.id });

		const timestamp = new Date(`${parameter.replace(this.indicatorRegex, indicator => ` ${indicator}`)}${dbUser?.timezone ? dbUser.timezone : ''}`);

		if (timestamp.toString() === 'Invalid Date') {
			return this.error({
				context,
				parameter,
				message: `${parameter} is not a valid date time`,
				identifier: 'InvalidDateTime'
			});
		}

		return this.ok(timestamp);
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		timestamp: Date;
	}
}
