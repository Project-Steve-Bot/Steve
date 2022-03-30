import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Type } from '@sapphire/type';
import { codeBlock, isThenable } from '@sapphire/utilities';
import type { Message } from 'discord.js';
import { inspect } from 'util';
import { SteveCommand } from '@lib/extensions/SteveCommand';

const ZWS = '\u200B';
@ApplyOptions<CommandOptions>({
	aliases: ['ev'],
	description: 'Evals any JavaScript code',
	quotes: [],
	preconditions: ['OwnerOnly'],
	flags: ['async', 'hidden', 'showHidden', 'show', 'silent', 's'],
	options: ['depth'],
	detailedDescription: {
		usage: '<code>',
		extendedHelp: 'Only Ben can use this command'
	}
})
export class UserCommand extends SteveCommand {

	private SECRETS = process.env.DISCORD_TOKEN
		? RegExp(process.env.DISCORD_TOKEN, 'g')
		: null;

	public async messageRun(message: Message, args: Args) {
		const code = await args.rest('string');

		const { result, success, type } = await this.eval(message, code, {
			async: args.getFlags('async'),
			depth: Number(args.getOption('depth')) ?? 0,
			showHidden: args.getFlags('hidden', 'showHidden', 'show')
		});
		const cleanResult = this.SECRETS
			? result
				.replace(this.SECRETS, 'This information has been hidden')
				.replace(/`/g, `\`${ZWS}`)
			: result.replace(/`/g, `\`${ZWS}`);

		const output = success
			? codeBlock('js', cleanResult)
			: `**ERROR**: ${codeBlock('bash', cleanResult)}`;
		if (args.getFlags('silent', 's')) return null;

		const typeFooter = `**Type**: ${codeBlock('typescript', type)}`;

		if (output.length > 2000) {
			return send(message, {
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`,
				files: [{ attachment: Buffer.from(output), name: 'output.js' }]
			});
		}

		return send(message, `${output}\n${typeFooter}`);
	}

	private async eval(
		message: Message,
		code: string,
		flags: { async: boolean; depth: number; showHidden: boolean }
	) {
		if (flags.async) code = `(async () => {\n${code}\n})();`;

		// @ts-expect-error value is never read, this is so `msg` is possible as an alias when sending the eval.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [msg, client] = [message, this.container.client];

		let success = true;
		let result = null;

		try {
			// eslint-disable-next-line no-eval
			result = eval(code);
		} catch (error) {
			if (error && error instanceof Error && error.stack) {
				this.container.client.logger.error(error);
			}
			result = error;
			success = false;
		}

		const type = new Type(result).toString();
		if (isThenable(result)) result = await result;

		if (typeof result !== 'string') {
			result = inspect(result, {
				depth: flags.depth,
				showHidden: flags.showHidden
			});
		}

		return { result, success, type };
	}

}
