import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { Guild, Message, WebhookClient } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Set the role play channel',
	requiredUserPermissions: 'MANAGE_CHANNELS',
	requiredClientPermissions: 'MANAGE_WEBHOOKS',
	runIn: ['GUILD_TEXT'],
	aliases: ['mrpc']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.inGuild()) {
			return send(msg, 'This command must be run in a server.');
		}
		const response = sendLoadingMessage(msg);

		await this.removeRPchannel(msg.guild);

		if (args.finished) {
			return (await response).edit('The role play channel has been removed.');
		}

		const channelResult = await args.restResult('guildTextChannel');

		if (channelResult.isErr()) {
			return (await response).edit('Please provide a valid text channel.');
		}

		const channel = channelResult.unwrap();
		const { url } = await channel.createWebhook(
			'rollPlayChannel',
			{ reason: `Roll play channel set by ${msg.author.tag} (${msg.author.id})` }
		);

		this.container.rpChannels.set(channel.id, new WebhookClient({ url }));

		await this.container.db.guilds.updateOne(
			{ id: msg.guildId },
			{ $set: { 'channels.rolePlay': { channel: channel.id, hook: url } } },
			{ upsert: true }
		);

		return (await response).edit(`<#${channel.id}> is now a role play channel.`);
	}

	private async removeRPchannel(guild: Guild) {
		const dbGuild = await this.container.db.guilds.findOne({ id: guild.id });

		if (!dbGuild?.channels?.rolePlay) {
			return;
		}

		const hook = this.container.rpChannels.get(dbGuild.channels.rolePlay.channel);

		if (hook) {
			await hook.delete('Role Play channel removed or changed');
		}

		this.container.rpChannels.delete(dbGuild.channels.rolePlay.channel);

		await this.container.db.guilds.findOneAndUpdate(
			dbGuild,
			{ $set: { 'channels.rolePlay': undefined } },
			{ upsert: true }
		);
	}

}
