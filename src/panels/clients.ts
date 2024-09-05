import * as vscode from "vscode";
import { getAuctionsURL } from "../auctions";
import { openLocalProject, runTerminalCommand } from "../commands";
import { actionsLink, search as ghSearch, startWorkflow } from "../github";
import { getUri } from "../utilities/getUri";
import { ErrorWithOptions } from "../utilities/error";
import { stepper } from "../utilities/stepper";

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
          const client = value;
          return vscode.window.showQuickPick([
            { label: 'Core Update', description: 'Update the core files', value: 'update' },
            { label: 'Build', description: 'Build the project', value: 'build' },
            { label: 'Deploy', description: 'Deploy the project', value: 'deploy' },
          ], {
            canPickMany: true,
            placeHolder: '⚠️ Selected actions will run on gh actions ⚠️',
          }).then(async (values) => {
            if (!values) return;
            vscode.window.withProgress({
              location: vscode.ProgressLocation.Notification,
              title: client.key.toUpperCase(),
              cancellable: true,
            }, async (progress, cancelationToken) => {
              const cancelationMessage = 'Polling cancelled, any running actions will continue to run unless cancelled manually';
              const options: { label: string, onClick: () => void }[] = [{
                label: 'View',
                onClick: () => vscode.env.openExternal(vscode.Uri.parse(actionsLink(client.key))),
              }];
              const onClick = (clicked?: string) => {
                const option = options.find(option => option.label === clicked);
                option?.onClick();
              };
              cancelationToken.onCancellationRequested(() => vscode.window.showInformationMessage(cancelationMessage, ...options.map(({ label }) => label)).then(onClick));
              const { step, total } = stepper({ total: values.length });
              const incrementPercent = 100 / total + 1;
              progress.report({ increment: 0 });

              try {
                if (values.some(value => value.value === 'update')) {
                  progress.report({ increment: incrementPercent, message: `(${step()}/${total}) Running Core update...` });
                  await startWorkflow(client.key, 'update');
                }

                if (values.some(value => value.value === 'build')) {
                  progress.report({ increment: incrementPercent, message: `(${step()}/${total}) Running Build...` });
                  await startWorkflow(client.key, 'deploy');
                }

                if (values.some(value => value.value === 'deploy')) {
                  progress.report({ increment: incrementPercent, message: `(${step()}/${total}) Running Deploy...` });
                  // TODO: use jenkins key to trigger deploy
                  const jenkins_link = client.links.find((link: any) => link.text === 'Jenkins')?.url;
                  if (jenkins_link) {
                    options.push({
                      label: 'Deploy',
                      onClick: () => vscode.env.openExternal(vscode.Uri.parse(jenkins_link)),
                    });
                  }
                }

                vscode.window.showInformationMessage(`${client.key.toUpperCase()} completed!`, ...options.map(({ label }) => label)).then(onClick);
              } catch (error) {
                let message = 'Unknown Error running actions';
                let options: { label: string; onClick: () => void }[] = [];

                if (error instanceof Error) {
                  message = error.message;
                  if (error instanceof ErrorWithOptions && error.details?.link) {
                    const errorLink = error.details?.link;
                    options = [{
                      label: 'Details',
                      onClick: () => vscode.env.openExternal(vscode.Uri.parse(errorLink))
                    }];
                  }
                }

                vscode.window.showErrorMessage(message, ...options.map(({ label }) => label)).then(clicked => {
                  const option = options.find(option => option.label === clicked);
                  option?.onClick();
                });
              } finally {
                progress.report({ increment: 100 });
              }
            });
          });
        }
        case "auctions": {
          const auctionsURL = await getAuctionsURL(value);
          if (auctionsURL) {
            return vscode.env.openExternal(vscode.Uri.parse(auctionsURL));
          }
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