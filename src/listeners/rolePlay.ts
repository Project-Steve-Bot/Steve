import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import type { WithId } from 'mongodb';
import type { RPCharter } from '../lib/types/database';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'Role Play - MessageCreate'
})
export class UserEvent extends Listener {

	public async run(msg: Message) {
		const hook = this.container.rpChannels.get(msg.channelId);
		if (!hook || !msg.inGuild() || msg.author.bot || !['DEFAULT', 'REPLY'].includes(msg.type)) return;

		const characters = await this.container.db.rpCharacters.find({ user: msg.author.id, guild: msg.guildId }).toArray();

		if (characters.length === 0) return;

		let character: WithId<RPCharter> | undefined;
		const { content: rawContent } = msg;

		if (characters.length === 1) {
			[character] = characters;
		} else {
			let defaultChar: WithId<RPCharter> | undefined;
			for (const possibleChar of characters) {
				if (possibleChar.prefix === null) {
					defaultChar = possibleChar;
					continue;
				}
				if (rawContent.startsWith(possibleChar.prefix)) {
					character = possibleChar;
					break;
				}
			}
			if (!character && defaultChar) {
				character = defaultChar;
			}
		}

		if (!character) return;

		const { prefix } = character;
		let content = prefix && rawContent.startsWith(prefix) ? rawContent.substring(prefix.length) : rawContent;

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
