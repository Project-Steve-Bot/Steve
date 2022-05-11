import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { MessageReaction, User } from 'discord.js';


@ApplyOptions<Listener.Options>({
	event: Events.MessageReactionAdd
})
export class UserEvent extends Listener {

	private pins = ['📌', '📍'];

	public async run(reaction: MessageReaction, user: User) {
		if (reaction.partial) {
			await reaction.fetch();
		}

		const { message: msg } = reaction;
		if (
			!msg.inGuild()
			|| msg.pinned
			|| !this.pins.includes(reaction.emoji.toString())
			|| msg.author.id === user.id
		) return;

		const dbGuild = await this.container.db.guilds.findOne({ id: msg.guildId });
		const setPoint = dbGuild?.voteToPin ?? 0;

		if (setPoint === 0) return;

		const voters = new Set<string>();

		msg.reactions.cache.filter(react => this.pins.includes(react.emoji.toString()))
			.forEach(pinReact => {
				pinReact.users.cache.forEach(reactor => {
					if (reactor.id !== msg.author.id) {
						voters.add(reactor.id);
					}
				});
			});

		if (voters.size >= setPoint) {
			msg.pin();
		}
	}

}
