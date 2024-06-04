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
  context.secrets.store('version', version);
}