import * as vscode from "vscode";
import { clientSearch, runTerminalCommand } from "./commands";
import { init as initPanels } from "./panels";

export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('as2.start', () => runTerminalCommand(`pm2 delete all; rush update; rush build && rush start`, { name: `AS2 Project Start` })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.coreUpdate', () => runTerminalCommand(`npx @snd/as2-update`, { name: `AS2 Core Update` })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.init', () => runTerminalCommand(`npx @snd/dev init`, { name: `AS2 Dev Init` })));
	context.subscriptions.push(vscode.commands.registerCommand('as2.clients.search', clientSearch));
	initPanels(context);
}

export function deactivate() {}