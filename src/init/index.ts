import * as vscode from "vscode";
import { welcome } from "./welcome";
import { devInit } from "./devInit";

export async function init(context: vscode.ExtensionContext) {
  welcome(context);

  const settings = vscode.workspace.getConfiguration('as2.clients');
  devInit(settings);
}