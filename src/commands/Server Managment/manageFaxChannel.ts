import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandContext, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { stripIndent } from 'common-tags';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Allows a channel to receive faxes.',
	requiredUserPermissions: ['MANAGE_CHANNELS'],
	runIn: ['GUILD_ANY'],
	detailedDescription: {
		usage: '<channel>',
		examples: ['#faxes'],
		extendedHelp: stripIndent`
		• You can add multiple fax channels
		• To remove a channel as a fax channel, run this command again
		• Removing a channel will send a message in that channel to notify those who used to get their faxes there`
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(
		msg: Message,
		args: Args,
		{ prefix }: CommandContext
	) {
		if (!msg.guild) {
			return send(msg, 'You need to run this command in a server mate.');
		}

		const channel = await args.pick('guildTextChannel');

		const guildSettings = await this.client.db.guilds.findOne({
			id: msg.guild.id
		});

		const added
			= !guildSettings?.channels?.fax?.includes(channel.id) ?? true;

		if (added) {
			await this.client.db.guilds.updateOne(
				{ id: msg.guild.id },
				{ $push: { 'channels.fax': channel.id } },
				{ upsert: true }
			);
		} else {
			await this.client.db.guilds.updateOne(
				{ id: msg.guild.id },
				{ $pull: { 'channels.fax': channel.id } },
				{ upsert: true }
			);

			const unfaxedUsers = await this.client.db.users
				.find({ 'fax.channel': channel.id })
				.toArray();

			await this.client.db.users.updateMany(
				{ 'fax.channel': channel.id },
				{ $set: { 'fax.channel': null } }
			);

			channel.send(
				`<@${unfaxedUsers
					.map((user) => user.id)
					.join(
						'>, <@'
					)}>, This channel no longer can receive faxes. Please update your fax channel with \`${prefix}setDesk\`.`
			);
		}

		return send(
			msg,
			`Faxes can ${added ? 'now' : 'no longer'} be sent in <#${
				channel.id
			}>.`
		);
	}

}
