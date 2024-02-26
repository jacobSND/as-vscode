import * as vscode from "vscode";
import * as semver from 'semver';
import { runTerminalCommand } from "../commands";

export async function init(context: vscode.ExtensionContext) {
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

  const hideInitPrompt = await context.secrets.get('hideInitPrompt');
  if (!hideInitPrompt) {
    const workspaceFolderUri = vscode.workspace.workspaceFolders?.[0].uri;
    const workspaceFolderName = workspaceFolderUri?.path.split('/').pop();
    if (workspaceFolderName?.includes('-auctionsoftware') && workspaceFolderUri) {
      try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspaceFolderUri, '.env'));
      } catch {
        const options = [
          { label: 'Run dev-init', onClick: () => runTerminalCommand(`npx @snd/dev init`, { name: `AS2 Dev Init`, ttl: 0 }) },
          { label: `Don't show again`, onClick: () => context.secrets.store('hideInitPrompt', 'true') },
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

  const settings = vscode.workspace.getConfiguration('as2.clients');
  if (settings?.pathOverrides || settings?.path_overrides) {
    let overrides = JSON.parse(JSON.stringify(settings.overrides ?? {}));
    let deprecatedOverrides = JSON.parse(JSON.stringify(settings.pathOverrides ?? settings.path_overrides ?? {}));
    for (const key in deprecatedOverrides) {
      overrides[key] = {
        localPath: deprecatedOverrides[key],
        ...overrides[key],
      };
    };
    settings.update('overrides', overrides, true);
    settings.update('pathOverrides', undefined, true);
    settings.update('path_overrides', undefined, true);
  }
}