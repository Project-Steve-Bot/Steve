import { ApplyOptions } from '@sapphire/decorators';
import { Args, type MessageCommandContext, type CommandOptions, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Set your fax number!',
	aliases: ['faxnumber'],
	detailedDescription: {
		usage: '<faxNumber>',
		extendedHelp: 'Your fax number must be in the form of ###-####'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args, ctx: MessageCommandContext) {
		const number = await args.pick('string');
		if (!/\d{3}-\d{4}/.test(number)) {
			throw new UserError({ message: 'A fax number must be in the form of ###-####', identifier: 'InvalidFaxNumber' });
		}

		const response = await sendLoadingMessage(msg);

		const faxUsers = await this.container.db.users.find({ 'fax.number': { $ne: undefined } }).toArray();

		const faxNumbers = faxUsers.map((user) => user.fax?.number).filter((hasNum) => hasNum);

		if (faxNumbers.includes(number)) {
			return response.edit(`${number} is already in use`);
		}

		await this.container.db.users.findOneAndUpdate({ id: msg.author.id }, { $set: { 'fax.number': number } }, { upsert: true });

		return response.edit(`Your fax number is now ${number}. Be sure to set where you'll receive faxes with \`${ctx.prefix}setdesk\``);
	}

}
