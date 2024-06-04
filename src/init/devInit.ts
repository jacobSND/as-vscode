import * as vscode from 'vscode';
import { runTerminalCommand } from "../commands";
import { set } from "lodash";

export async function devInit(settings: vscode.WorkspaceConfiguration) {
  const overrides = JSON.parse(JSON.stringify(settings.overrides ?? {}));
  if (!overrides['*']?.hideInitPrompt) {
    const workspaceFolderUri = vscode.workspace.workspaceFolders?.[0].uri;
    const workspaceFolderName = workspaceFolderUri?.path.split('/').pop();
    if (workspaceFolderName?.includes('-auctionsoftware') && workspaceFolderUri) {
      const clientKey = workspaceFolderName.split('-')[0];
      if (overrides[clientKey]?.hideInitPrompt) {
        return;
      }
      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspaceFolderUri, '.env'));
      } catch {
        const options = [
          { label: 'Run dev-init', onClick: () => runTerminalCommand(`npx @snd/dev init`, { name: `AS2 Dev Init`, ttl: 0 }) },
          {
            label: `Don't show again`, onClick: () => {
              vscode.window.showInformationMessage('Hide for this Client or All Clients?', 'This Client', 'All Clients').then((value) => {
                if (value) {
                  set(overrides, `${value === 'This Client' ? clientKey : '*'}.hideInitPrompt`, true);
                  settings.update('overrides', overrides, true);
                }
              });
            }
          }
        ];
        vscode.window.showInformationMessage(
          'Would you like to initialize this Auctioneer Software project?',
          ...(options.map(({ label }) => label))
        ).then(clicked => {
          const option = options.find(option => option.label === clicked);
          option?.onClick();
        });
      }
    }
  }
}