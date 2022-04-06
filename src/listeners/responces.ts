import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class UserEvent extends Listener {

	public async run(msg: Message) {
		if (msg.author.bot) return;

		const lowerContent = msg.content.toLowerCase();

		if (lowerContent.includes((process.env.BOT_NAME ?? 'steve').toLowerCase())) {
			if (lowerContent.includes('thank')) {
				msg.react('721911747325460501');
			}

			if (lowerContent.includes('love you')) {
				msg.react('739973420841959549');
				msg.reply({ content: 'I love you too', allowedMentions: { repliedUser: false } });
			}
		}
	}

}
