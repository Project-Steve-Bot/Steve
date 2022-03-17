import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import type { CountData } from '@lib/types/database';

@ApplyOptions<CommandOptions>({
	description: 'Sets the count channel.',
	aliases: ['countchannel'],
	requiredUserPermissions: ['MANAGE_CHANNELS'],
	runIn: ['GUILD_ANY'],
	detailedDescription: {
		usage: '(channel)',
		examples: ['', '#counting'],
		extendedHelp: 'Running this command with no arguments allows reminders to be sent in any channel.'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.guild) {
			return send(msg, 'You need to run this command in a server mate.');
		}

		const channel = args.finished
			? undefined
			: await args.pick('guildTextChannel');

		const dbGuild = await this.client.db.guilds.findOne({ id: msg.guild.id });

		if (dbGuild?.channels?.count) {
			this.client.countChannels.delete(dbGuild.channels.count);
		}

		const countData: CountData = dbGuild?.count || {
			counter: 0,
			lastUser: null,
			participants: [],
			max: 0,
			maxPin: null,
			started: new Date()
		};

		const newGuild = (await this.client.db.guilds.findOneAndUpdate(
			{ id: msg.guild.id },
			{ $set: {
				'channels.count': channel?.id,
				count: countData
			} },
			{ upsert: true }
		)).value;

		if (channel && newGuild) {
			this.client.countChannels.set(channel.id, newGuild);
			return send(msg, `<#${channel.id}> is now a counting channel.`);
		}

		return send(msg, 'There is no more counting channel');
	}

}
