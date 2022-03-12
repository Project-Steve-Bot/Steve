import { Argument } from '@sapphire/framework';
import type { WithId } from 'mongodb';
import type { Snippet } from '../lib/types/database';

export class SnippetArgument extends Argument<WithId<Snippet>> {

	public async run(parameter: string, context: Argument.Context) {
		const msg = context.message;
		if (!msg.inGuild()) {
			return this.error({
				context,
				parameter,
				message: 'Snippets only exist in servers',
				identifier: 'NoGuildSnippet'
			});
		}

		const snip = await this.container.client.db.snips.findOne({ guildId: msg.guildId, snipId: parameter.replace(' ', '-') });

		if (!snip) {
			return this.error({
				context,
				parameter,
				message: `Snippet \`${parameter}\` does not exist.`,
				identifier: 'NonexistentSnippet'
			});
		}

		return this.ok(snip);
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		snippet: WithId<Snippet>;
	}
}
