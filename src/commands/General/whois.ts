import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { Args, CommandOptions } from '@sapphire/framework';
import { ColorResolvable, Message, EmbedBuilder, time, TimestampStyles } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Get information about a user or about yourself!',
	aliases: ['whoami'],
	runIn: 'GUILD_ANY',
	detailedDescription: {
		usage: '[user]'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const targetResult = await args.peekResult('member');
		// const target = args.finished ? msg.member : await (await args.peekResult('member')).success ?
		const target = args.finished
			? msg.member
			: targetResult.unwrapOr(null);

		if (!target) {
			return send(msg, 'Something went wrong and I couldn\'t find that user.');
		}

		const targetData = await this.container.db.users.findOne({ id: target.id });

		const embed = new EmbedBuilder()
			.setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
			.setColor((targetData?.embedColor || 'AQUA') as ColorResolvable)
			.addFields([
				{ name: 'Display Name', value: target.displayName, inline: true },
				{
					name: 'Account Created',
					value: `${time(target.user.createdAt, TimestampStyles.LongDateTime)} (${time(target.user.createdAt, TimestampStyles.RelativeTime)})`,
					inline: true
				}, {
					name: 'Joined Server',
					value: target.joinedAt ? `${time(target.joinedAt, TimestampStyles.LongDateTime)} (${time(target.joinedAt, TimestampStyles.RelativeTime)})` : 'Unknown',
					inline: true
				}, {
					name: 'Roles',
					value: target.roles.cache.size > 0 ? target.roles.cache.map(role => role.toString()).join(' ') : 'None'
				}
			])
			.setTimestamp();
		return send(msg, { embeds: [embed] });
	}

}
