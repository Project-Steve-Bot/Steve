import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { Message, WebhookClient } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Set the role play channel',
	requiredUserPermissions: 'ManageChannels',
	requiredClientPermissions: 'ManageWebhooks',
	runIn: ['GUILD_TEXT'],
	aliases: ['mrpc']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.inGuild()) {
			return send(msg, 'This command must be run in a server.');
		}
		const response = sendLoadingMessage(msg);

		const channelResult = await args.restResult('guildTextChannel');

		if (channelResult.isErr()) {
			return (await response).edit('Please provide a valid text channel.');
		}

		const guildSettings = await this.container.db.guilds.findOne({
			id: msg.guild.id
		});

		const channel = channelResult.unwrap();

		const added
			= !guildSettings?.channels?.rolePlay?.map(rp => rp.channel)?.includes(channel.id) ?? true;

		if (!added) {
			await this.removeRPchannel(msg.guildId, channel.id);
			return (await response).edit(`<#${channel.id}> is no longer a roll pay channel.`);
		}


		const { url } = await channel.createWebhook({
			name: 'rollPlayChannel',
			reason: `Roll play channel set by ${msg.author.tag} (${msg.author.id})`
		});

		this.container.rpChannels.set(channel.id, new WebhookClient({ url }));

		await this.container.db.guilds.updateOne(
			{ id: msg.guildId },
			{ $push: { 'channels.rolePlay': { channel: channel.id, hook: url } } },
			{ upsert: true }
		);

		return (await response).edit(`<#${channel.id}> is now a role play channel.`);
	}

	private async removeRPchannel(guildId: string, channelId: string) {
		const hook = this.container.rpChannels.find((_, id) => id === channelId);

		if (hook) {
			await hook.delete('Role Play channel removed or changed');
		}

		this.container.rpChannels.delete(channelId);

		await this.container.db.guilds.findOneAndUpdate(
			{ id: guildId },
			{ $pull: { 'channels.rolePlay': { channel: channelId } } },
			{ upsert: true }
		);
	}

}
