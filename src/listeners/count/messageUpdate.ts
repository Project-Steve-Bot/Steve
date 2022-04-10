import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { resetCount } from '@lib/utils';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Listener.Options>({
	event: Events.MessageUpdate,
	name: 'Count - MessageUpdate'
})
export class UserEvent extends Listener {

	public async run(_: Message, msg: Message) {
		if (this.container.client.countChannels.has(msg.channelId)) {
			return resetCount(msg, 'Sorry mate but editing isn\'t allowed here.', true);
		}
		return;
	}

}
