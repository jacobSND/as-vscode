import * as vscode from "vscode";
import * as semver from 'semver';

export async function init(context: vscode.ExtensionContext) {
  const version = context.extension.packageJSON.version;
  const prevVersion = await context.secrets.get('version') || "0.0.0";
  if (semver.gt('1.2.5', prevVersion)) {
    vscode.window.showInformationMessage('Tip: CTRL + click on client domains to access the admin URL', 'Changelog', 'Dismiss').then((value) => {
      if (value === 'Changelog') {
        vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(`${__dirname}/../CHANGELOG.md`));
      }
    });
  }
  context.secrets.store('version', version);

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