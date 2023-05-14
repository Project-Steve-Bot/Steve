import { ApplyOptions } from '@sapphire/decorators';
import { Args, type CommandOptions, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Add or remove a role from the list of assignable roles.',
	aliases: ['mar'],
	runIn: 'GUILD_ANY',
	requiredUserPermissions: 'ManageRoles',
	detailedDescription: {
		usage: '<role>',
		extendedHelp: 'The role will be added to the list if it isn\'t in it and removed from it if it is.'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.guildId) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildManageAssignableRoles' });
		}

		const response = await sendLoadingMessage(msg);

		const target = await args.rest('role');

		const dbGuild = await this.container.db.guilds.findOne({ id: msg.guildId });

		let added = true;
		if (dbGuild?.assignableRoles?.includes(target.id)) {
			added = false;
			await this.container.db.guilds.findOneAndUpdate(
				{ id: msg.guildId },
				{ $pull: { assignableRoles: target.id } },
				{ upsert: true });
		} else {
			await this.container.db.guilds.findOneAndUpdate(
				{ id: msg.guildId },
				{ $push: { assignableRoles: target.id } },
				{ upsert: true }
			);
		}

		return response.edit({
			content: `${target} has been ${added ? 'added to' : 'removed from'} the list of assignable roles.`,
			allowedMentions: { roles: [] }
		});
	}

}
