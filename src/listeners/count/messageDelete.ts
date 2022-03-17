import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { resetCount } from '@lib/utils';

export class UserEvent extends Listener {

	public async run(msg: Message) {
		if (this.container.client.countChannels.has(msg.channelId)) {
			resetCount(msg, 'Deleting a message in this channel resets the count!', true, true);
		}
	}

}
