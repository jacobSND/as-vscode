import * as vscode from "vscode";
import { getAuctions } from "../as2";
import { openLocalProject, runTerminalCommand } from "../commands";
import { search as ghSearch, startWorkflow } from "../github";
import { getUri } from "../utilities/getUri";

export class ClientsPanel implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async init() {
    let folder = vscode.workspace.workspaceFolders?.[0].uri.path.split('/').pop();
    if (folder?.includes('-auctionsoftware')) {
      const results = await ghSearch(folder.split('auctionsoftware')?.[0]);
      if (results?.length) {
        return this?._view?.webview?.postMessage({ action: 'search', value: results });
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
        case "openProject": {
          return openLocalProject(value);
        }
        case "buildDeploy": {
          return vscode.window.showQuickPick([
            { label: 'Core Update', description: 'Update the core files', value: 'update' },
            { label: 'Build', description: 'Build the project', value: 'build' },
            // TODO: { label: 'Deploy', description: 'Deploy the project', value: 'deploy' },
          ], {
            canPickMany: true,
            placeHolder: '⚠️ Selected actions will run on gh actions ⚠️',
          }).then(async (values) => {
            if (!values) return;
            vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: `${value.key} Progress`,
              cancellable: true,
            }, async (progress, cancelationToken) => {
              cancelationToken.onCancellationRequested(() => vscode.window.showInformationMessage('Polling cancelled, any running actions will continue to run unless cancelled manually'));

              const incrementSize = 100 / (values.length + 1);
              progress.report({ increment: 0 });

              try {
                if (values.some(value => value.value === 'update')) {
                  progress.report({ increment: incrementSize, message: "Running Core update..." });
                  await startWorkflow(value.key, 'update');
                }

                if (values.some(value => value.value === 'build')) {
                  progress.report({ increment: incrementSize, message: "Running Build..." });
                  await startWorkflow(value.key, 'deploy');
                }

                if (values.some(value => value.value === 'deploy')) {
                  progress.report({ increment: incrementSize, message: "Running Deploy..." });
                  // TODO: jenkins deploy
                }

                vscode.window.showInformationMessage('Actions completed!');
              } catch (error) {
                vscode.window.showErrorMessage(`Error running actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                progress.report({ increment: 100 });
              }
            });
          });
        }
        case "auctions": {
          const auctions = await getAuctions(value);
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