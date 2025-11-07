import * as vscode from "vscode";
import { auctionSearch } from "../as2";
import { openLocalProject, runTerminalCommand } from "../commands";
import { actionsLink, search as ghSearch, startWorkflow } from "../github";
import { getUri } from "../utilities/getUri";

const defaultActions = [
  "Copilot Chat",
  "Build & Deploy",
  "Github Repo",
  "Open Project",
  "Github Dev",
  "Connect to DB"
] as const;

export class ClientsPanel implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _configChangeListener?: vscode.Disposable;

  constructor(private readonly context: vscode.ExtensionContext) {}

  private getActionSettings(): typeof defaultActions {
    const config = vscode.workspace.getConfiguration('as2.clients');
    return config.get('actionsEnabled', defaultActions);
  }

  private notifyWebviewOfSettings() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'settingsUpdate',
        payload: this.getActionSettings()
      });
    }
  }

  async init() {
    let folder = vscode.workspace.workspaceFolders?.[0].uri.path.split('/').pop();
    let client = !folder?.includes('auctionsoftware') ? null : {
      key: folder?.includes('-auctionsoftware') ? folder.split('-auctionsoftware')[0] : 'core'
    };

    if (client && client.key !== 'core') {
      const results = await ghSearch(client.key);
      if (results?.length) {
        client = results.find(c => c.key === client?.key) || null;
        if (client) {
          this?._view?.webview?.postMessage({ action: 'current_client', value: client });
        }
      }
    }
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this.context.extensionUri,
			],
		};

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    this._configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('as2.clients.actionsEnabled')) {
        this.notifyWebviewOfSettings();
      }
    });
    this.context.subscriptions.push(this._configChangeListener);

    this.init();

    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      const command = message.command;
      const value = message.value;

      switch (command) {
        case "search": {
          const results = await vscode.window.withProgress({
            location: { viewId: 'as2-clients' },
          }, async () => await ghSearch(value));
          return this?._view?.webview?.postMessage({ action: 'search', value: results });
        }
        case "copy": {
          return vscode.env.clipboard.writeText(value);
        }
        case "connectDb": {
          return runTerminalCommand(`ssh ${value?.sshUser || 'snd_root'}@${value.db}`, { name: `${value.key} (AS2)`, ttl: 0 });
        }
        case "customTerminalCommand": {
          const config = vscode.workspace.getConfiguration('as2.clients');
          const terminalCommandTemplate = config.get<string>('customTerminalCommand', '');
          if (!terminalCommandTemplate) {
            return vscode.window.showErrorMessage('No custom terminal command template set in settings.');
          }
          const missingOrInvalidKeys: string[] = [];
          const terminalCommand = terminalCommandTemplate.replace(/\{(\w+)\}/g, (match, key) => {
            const replacement = value[key];
            if (replacement === undefined || typeof replacement === 'object') {
              missingOrInvalidKeys.push(key);
              return match;
            }
            return replacement;
          });
          if (missingOrInvalidKeys.length) {
            return vscode.window.showWarningMessage(
              `The following placeholders were unable to be replaced: ${missingOrInvalidKeys.map(k => `{${k}}`).join(', ')}`
            );
          }
          return runTerminalCommand(terminalCommand, { name: `${value.key} (AS2)`, ttl: 0 });
        }
        case "openProject": {
          return openLocalProject(value);
        }
        case "buildDeploy": {
          const client = value;
          return vscode.window.showQuickPick([
            { label: 'Core Update', description: 'Update the core files', value: 'update' },
            { label: 'Build', description: 'Build the project', value: 'build' },
          ], {
            canPickMany: true,
            placeHolder: '⚠️ Selected actions will run on gh actions ⚠️',
          }).then(async (values) => {
            if (!values) return;

            if (values.some(value => value.value === 'update')) {
              const inputs = values.some(value => value.value === 'build') ? { build: true } : undefined;
              startWorkflow(client.key, 'update', inputs);
            } else if (values.some(value => value.value === 'build')) {
              startWorkflow(client.key, 'deploy');
            }

            const message = 'Running ' + [...values.map(v => v.label)].join(' & ') + ` for ${client.key.toUpperCase()}`;
            vscode.window.showInformationMessage(message, 'View').then(clicked => {
              if (clicked) {
                const actions_link = actionsLink(client.key);
                vscode.env.openExternal(vscode.Uri.parse(actions_link));
              }
            });
          });
        }
        case "auctions": {
          const auctions = await auctionSearch(value);
          const panel = vscode.window.createWebviewPanel(
            'auctions',
            'Auctions',
            vscode.ViewColumn.One,
            {},
          );
          panel.webview.html = /* html */`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Auctions</title>
              </head>
              <body>
                <table>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                  </tr>
                  <tr>
                    <td>${auctions?.auctions?.[0]?.auction_id ?? ''}</td>
                    <td>${auctions?.auctions?.[0]?.title ?? ''}</td>
                  </tr>
                </table>
              </body>
            </html>
          `;
        }
        case "aiChat": {
          const client = value;
          await vscode.commands.executeCommand('workbench.action.chat.open', vscode.l10n.t('@AS Hi!&nbsp;Lets chat about #client {0}', client.name || client.key));
          break;
        }
        case 'getSettings': {
          return this.notifyWebviewOfSettings();
        }
        default: {
          console.log({ message });
        }
      }
    });
  }

  public show() {
    if (!this._view) {
      vscode.commands.executeCommand("as2-clients.focus");
    } else {
      this._view?.show(false);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const DEV = this.context.extensionMode === vscode.ExtensionMode.Development;

    const stylesUri = getUri(webview, this.context.extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    const scriptUri = DEV ? 'http://localhost:3300/src/index.tsx' : getUri(webview, this.context.extensionUri, ["webview-ui", "build", "assets", "index.js"]);
    const codiconsUri = getUri(webview, this.context.extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link rel="stylesheet" href="${codiconsUri}" />
          
          <title>AS2 Clients</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}