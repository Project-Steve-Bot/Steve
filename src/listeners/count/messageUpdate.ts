import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { resetCount } from '@lib/utils';

export class UserEvent extends Listener {

	public async run(_: Message, msg: Message) {
		if (this.container.client.countChannels.has(msg.channelId)) {
			resetCount(msg, 'Sorry mate but editing isn\'t allowed here.', true);
		}
	}

}
