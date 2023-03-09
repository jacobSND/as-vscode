import * as vscode from "vscode";
import { ClientsPanel } from "./clients";

export function init(context: vscode.ExtensionContext) {
  const clientsViewProvider = new ClientsPanel(context);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('as2-clients', clientsViewProvider, { webviewOptions: { retainContextWhenHidden: true }}));
  context.subscriptions.push(vscode.commands.registerCommand('as2.showClients', () => clientsViewProvider.show()));
}