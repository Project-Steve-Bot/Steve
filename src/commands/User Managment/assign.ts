import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandContext, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubCommandPluginCommandOptions>({
	description: 'View, assign, and unassign self assignable roles.',
	runIn: 'GUILD_ANY',
	detailedDescription: {
		usage: '<role | view>'
	},
	subCommands: [
		{ input: 'assign', default: true },
		'list'
	]
})
export class UserCommand extends SteveCommand {

	public async assign(msg: Message, args: Args, ctx: CommandContext) {
		if (!msg.inGuild() || !msg.member) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildAssign' });
		}

		const targetRole = await args.rest('role');

		const isAssignable = await this.container.db.guilds.countDocuments({ id: msg.guildId, assignableRoles: targetRole.id }) === 1;

		if (!isAssignable) {
			return send(msg, `Sorry but ${targetRole.name} is not self assignable. Use \`${ctx.prefix}assign list\` to see all self assignable roles.`);
		}

		let added = true;

		if (msg.member.roles.cache.has(targetRole.id)) {
			added = false;
			await msg.member.roles.remove(targetRole, 'Member self unassigned');
		} else {
			await msg.member.roles.add(targetRole, 'Member self assigned');
		}

		return send(msg, `${added ? '<:plus:746221362103713854> Added' : '<:minus:746221413727469619> Removed'} ${targetRole.name}.`);
	}

	public async list(msg: Message, _: Args, ctx: CommandContext) {
		if (!msg.inGuild()) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildAssign' });
		}

		const response = await sendLoadingMessage(msg);

		const dbGuild = await this.container.db.guilds.findOne({ id: msg.guildId });

		if (!dbGuild?.assignableRoles || dbGuild.assignableRoles.length === 0) {
			return response.edit('This server has no assignable roles.');
		}

		const embed = new MessageEmbed()
			.setTitle('Assignable roles')
			.setColor('YELLOW')
			.setDescription(`Use \`${ctx.commandPrefix}assign <role>\` to assign or unassign any of these roles
			<@&${dbGuild.assignableRoles.join('>, <@&')}>`);

		return response.edit({ content: ' ', embeds: [embed] });
	}

}
