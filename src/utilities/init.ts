import * as vscode from "vscode";

export function init() {
  const settings = vscode.workspace.getConfiguration('as2.clients');
  if (settings.pathOverrides || settings.path_overrides) {
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