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
		if (!hook || !msg.inGuild() || msg.author.bot || !['DEFAULT', 'REPLY'].includes(msg.type)) return;

		const character = await this.container.db.rpCharacters.findOne({ user: msg.author.id, guild: msg.guildId });

		if (!character) return;

		let { content } = msg;

		if (msg.reference?.messageId) {
			const repliedMessage = await msg.channel.messages.fetch(msg.reference.messageId);
			content = `> [**${repliedMessage.author.username}** ${
				repliedMessage.content.length > 25
					? `${repliedMessage.content.substring(0, 25)}...`
					: repliedMessage.content
			}](${repliedMessage.url})\n${content}`;
		}

		await hook.send({
			username: character.name,
			content: content === '' ? null : content,
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
