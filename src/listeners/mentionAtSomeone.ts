import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { pickRandom } from '../lib/utils';

const MENTION_MESSAGES = [
	' I choose you!',
	', someone wanted you to know about this. Or well, not you specifically, just someone!',
	' PING',
	'! Congratulations, you\'ve won a brand new Ping!'
];

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
	name: 'Mention @someone - MessageCreate'
})
export class UserEvent extends Listener {

	public async run(msg: Message) {
		if (msg.author.bot || !msg.inGuild() || !['@someone', '@anyone'].some(mention => msg.content.includes(mention))) {
			return;
		}

		const dbGuild = await this.container.db.guilds.findOne({ id: msg.guildId });
		if (!dbGuild?.mentionSomeone) {
			return;
		}

		const randomMember = await msg.guild.members.fetch().then(members => members.random());
		if (!randomMember) {
			throw new Error('Could not get random guild member for @someone');
		}

		msg.reply({ allowedMentions: { users: [randomMember.id] }, content: `${randomMember}${pickRandom(MENTION_MESSAGES)}` });
	}

}
