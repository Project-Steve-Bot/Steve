import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
	description: 'Set how many 📌 reactions are needed to pin a message.',
	aliases: ['svtp'],
	detailedDescription: {
		extendedHelp: 'Setting this to `0` disables vote to pin.'
	},
	requiredUserPermissions: 'MANAGE_MESSAGES',
	runIn: 'GUILD_ANY'
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.guildId) {
			return send(msg, 'You need to run this command in a server.');
		}

		const setPointResult = await args.pickResult('number');

		if (!setPointResult.success) {
			return send(msg, 'Please specify the number of 📌 reactions needed to pin a message.');
		}

		const setPoint = setPointResult.value > 0 ? setPointResult.value : 0;

		await this.container.db.guilds.updateOne({ id: msg.guildId }, { $set: { voteToPin: setPoint } }, { upsert: true });

		return send(msg, `I've ${setPoint === 0 ? 'turned vote to pin off' : `set the minimum 📌 count to ${setPoint}`}.`);
	}

}
