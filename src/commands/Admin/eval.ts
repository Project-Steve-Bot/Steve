import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Type } from '@sapphire/type';
import { codeBlock, isThenable } from '@sapphire/utilities';
import type { Message } from 'discord.js';
import { inspect } from 'util';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendToFile } from '@lib/utils';
import { Stopwatch } from '@sapphire/stopwatch';
import { stripIndents } from 'common-tags';

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

	private SECRETS = [
		process.env.DISCORD_TOKEN,
		process.env.MONGO_CONNECTION,
		process.env.LOG_HOOK
	];

	public async messageRun(message: Message, args: Args) {
		const code = await args.rest('string');

		const stopwatch = new Stopwatch();
		const { result, success, type } = await this.eval(message, code, {
			async: args.getFlags('async'),
			depth: Number(args.getOption('depth')) ?? 0,
			showHidden: args.getFlags('hidden', 'showHidden', 'show')
		});
		stopwatch.stop();

		let cleanResult = result.replace(/`/g, `\`${ZWS}`);

		this.SECRETS.forEach(secret => {
			if (secret) {
				cleanResult = cleanResult.replaceAll(secret, 'This information has been hidden');
			}
		});

		const output = success
			? codeBlock('js', cleanResult)
			: `**ERROR**: ${codeBlock('bash', cleanResult)}`;
		if (args.getFlags('silent', 's')) return null;

		const footer = stripIndents`**Type**: ${codeBlock('ts', type || 'unknown')}
		⏱️ ${stopwatch.toString()}`;

		if (output.length > 2000) {
			return send(message, {
				content: `Output was too long... sent the result as a file.\n\n${footer}`,
				files: [sendToFile(cleanResult, { filename: 'output', extension: success ? 'js' : 'sh' })]
			});
		}

		return send(message, `${output}\n${footer}`);
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
