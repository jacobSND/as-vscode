import * as vscode from "vscode";
import { welcome } from "./welcome";
import { devInit } from "./devInit";

export async function init(context: vscode.ExtensionContext) {
  const settings = vscode.workspace.getConfiguration('as2.clients');
  // TODO: download clientDefaults.json from remote repo
  await welcome(context);
  await devInit(settings);
}