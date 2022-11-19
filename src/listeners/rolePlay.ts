import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'Role Play - MessageCreate'
})
export class UserEvent extends Listener {

	public async run(msg: Message) {
		const hook = this.container.rpChannels.get(msg.channelId);
		if (!hook || !msg.inGuild() || msg.author.bot || msg.type !== 'DEFAULT') return;

		const character = await this.container.db.rpCharacters.findOne({ user: msg.author.id, guild: msg.guildId });

		if (!character) return;

		await hook.send({
			username: character.name,
			content: msg.content === '' ? null : msg.content,
			avatarURL: character.pfp,
			files: msg.attachments.toJSON(),
			allowedMentions: {
				users: msg.mentions.users.map(user => user.id),
				roles: msg.mentions.roles.map(role => role.id)
			}
		});
		msg.delete();
	}

}
