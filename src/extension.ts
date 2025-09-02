import * as vscode from "vscode";
import { clientSearch, runTerminalCommand } from "./commands";
import { init as initPanels } from "./panels";
import { init } from "./init";

export async function activate(context: vscode.ExtensionContext) {
	try {
		await init(context);

		const commands = [
			{
				id: 'as2.settings',
				handler: () => vscode.commands.executeCommand('workbench.action.openSettings', 'Auctioneer Software')
			},
			{
				id: 'as2.start',
				handler: () => runTerminalCommand(`pm2 status; rush update; rush build && rush start`, { name: `AS2 Project Start`, ttl: 0 })
			},
			{
				id: 'as2.logs',
				handler: () => runTerminalCommand(`pm2 logs`, { name: `AS2 Logs` })
			},
			{
				id: 'as2.coreUpdate',
				handler: () => runTerminalCommand(`npx @snd/as2-update`, { name: `AS2 Core Update` })
			},
			{
				id: 'as2.devInit',
				handler: () => runTerminalCommand(`npx @snd/dev init`, { name: `AS2 Dev Init` })
			},
			{
				id: 'as2.clients.search',
				handler: clientSearch
			}
		];

		commands.forEach(({ id, handler }) => {
			context.subscriptions.push(vscode.commands.registerCommand(id, handler));
		});

		await initPanels(context);
	} catch (error) {
		console.error('Failed to activate Auctioneer Software extension:', error);
		vscode.window.showErrorMessage(`Failed to activate Auctioneer Software extension: ${error}`);
	}
}

export function deactivate() {}