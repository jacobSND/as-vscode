import * as vscode from "vscode";
import { clientSearch, runTerminalCommand } from "./commands";
import { init as initPanels } from "./panels";
import { init } from "./init";

export async function activate(context: vscode.ExtensionContext) {
	init(context);
	context.subscriptions.push(vscode.commands.registerCommand('as2.settings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'Auctioneer Software')));
	context.subscriptions.push(vscode.commands.registerCommand('as2.start', () => runTerminalCommand(`pm2 status; rush update; rush build && rush start`, { name: `AS2 Project Start`, ttl: 0 })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.logs', () => runTerminalCommand(`pm2 logs`, { name: `AS2 Logs` })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.coreUpdate', () => runTerminalCommand(`npx @snd/as2-update`, { name: `AS2 Core Update` })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.devInit', () => runTerminalCommand(`npx @snd/dev init`, { name: `AS2 Dev Init` })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.clients.search', clientSearch));
	initPanels(context);
}

export function deactivate() {}