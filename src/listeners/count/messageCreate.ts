import { Events, Listener } from '@sapphire/framework';
import { Message, MessageType } from 'discord.js';
import { resetCount } from '@lib/utils';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'Count - MessageCreate'
})
export class UserEvent extends Listener {

	public async run(msg: Message) {
		const { count: countData } = this.container.client.countChannels.get(msg.channelId) ?? { count: undefined };

		if (!countData || !msg.inGuild() || msg.author.bot || msg.type !== MessageType.Default) {
			return;
		}

		if (msg.attachments.size) {
			return resetCount(msg, 'That attachment isn\'t a number fam.');
		}

		if (msg.stickers.size) {
			return resetCount(msg, 'Stickers are nice but they ain\'t numbers.');
		}

		const newNumber = parseInt(msg.content);

		if (isNaN(newNumber)) {
			return resetCount(msg, `Sorry but **${msg.content}** isn't a number.`);
		}

		if (!/^\d+$/.test(msg.content)) {
			return resetCount(msg, 'You\'ve sent some things that aren\'t numbers there mate.');
		}

		if (msg.author.id === countData.lastUser) {
			return resetCount(msg, 'Sorry mate but you\'re not allow to count twice in a row.');
		}

		if (newNumber < countData.counter) {
			return resetCount(msg, `Believe it or not ${newNumber} is actually less than ${countData.counter}.`);
		}

		if (newNumber !== countData.counter + 1) {
			return resetCount(msg, `Sorry mate but ${newNumber} isn't what comes next.`);
		}

		const newGuild = await this.container.db.guilds.findOneAndUpdate(
			{ id: msg.guildId },
			{
				$inc: { 'count.counter': 1 },
				$set: { 'count.lastUser': msg.author.id },
				$addToSet: { 'count.participants': msg.author.id }
			},
			{ returnDocument: 'after' }
		);

		if (!newGuild) {
			msg.channel.send('FIRE! FIRE! SOMETHING BROKE AND IDK WHATS GOING ON!');
			throw new Error('Count failed to update');
		}

		this.container.client.countChannels.set(msg.channelId, newGuild);
		return;
	}

}
