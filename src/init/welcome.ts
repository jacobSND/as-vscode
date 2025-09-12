import * as vscode from 'vscode';
import * as semver from 'semver';

export async function welcome(context: vscode.ExtensionContext) {
  const version = context.extension.packageJSON.version;
  const prevVersion = await context.secrets.get('version') || "0.0.0";
  if (semver.gte('0.0.0', prevVersion)) {
    vscode.window.showInformationMessage('View the Auctioneer Software "Getting Started" guide?', 'View Guide', 'Dismiss').then((value) => {
      if (value === 'View Guide') {
        vscode.env.openExternal(vscode.Uri.parse("https://github.com/AuctionSoft/auctionsoftware/wiki"));
      }
    });
  }

  if (semver.lt(prevVersion, '1.5.0')) {
    vscode.window.showInformationMessage('Auctioneer Software now has ⚙️ Settings to control client actions and an ✨ AI Chat participant @AS', 'View Settings', 'View Changelog', 'Dismiss').then((value) => {
      if (value === 'View Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'as2.clients.actions');
      } else if (value === 'View Changelog') {
        vscode.env.openExternal(vscode.Uri.parse("https://github.com/jacobSND/as-vscode/releases/tag/v1.5.0"));
      }
    });
  }

  context.secrets.store('version', version);
}