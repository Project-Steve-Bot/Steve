import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserEvent extends Listener<'mentionPrefixOnly'> {

	public async run(message: Message) {
		const prefix = this.container.client.options.defaultPrefix;
		if (!message.channel.isSendable()) return;
		return message.channel.send(
			prefix
				? `My prefix in this guild is: \`${prefix}\``
				: 'You do not need a prefix in DMs.'
		);
	}

}
