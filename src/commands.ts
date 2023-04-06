import * as vscode from "vscode";
import * as fs from 'fs';
import * as os from 'os';
import { search as ghSearch } from "./github";

type TerminalCommandOptions = {
  name?: string,
  ttl?: number,
}
export async function runTerminalCommand(command: string, { name, ttl }: TerminalCommandOptions = {}) {
  const terminal = vscode.window.createTerminal(name);
  if (ttl === 0) command += ' && exit';
  terminal.sendText(command);
  terminal.show();
  if (ttl) {
    setTimeout(() => terminal.dispose(), ttl);
  }
}

export function openLocalProject({ localPath, ...client }: any) {
  localPath = localPath.replace(/^\~\//, os.homedir() + '/');
  if (fs.existsSync(localPath)) {
    runTerminalCommand(`code ${localPath}`, { ttl: 0 });
  } else {
    const options = [
      { label: 'Clone Locally', onClick: () => runTerminalCommand(`git clone ${client.repo} ${localPath} && code ${localPath}`, { ttl: 0 }) },
      { label: 'Open on Github.dev', onClick: () => vscode.env.openExternal(vscode.Uri.parse(client.repo.replace('.com', '.dev'))) },
    ];
    vscode.window.showErrorMessage(
      `Local repo not found ${localPath}`,
      ...(options.map(option => option.label))
    ).then(clicked => {
      const option = options.find(option => option.label === clicked);
      option?.onClick();
    });
  }
    
}

export async function clientSearch() {
  let folder = vscode.workspace.workspaceFolders?.[0].uri.path.split('/').pop();
  let defaultValue = '';
  if (folder?.includes('-auctionsoftware')) {
    defaultValue = folder.split('-auctionsoftware')?.[0];
  }

  const query = (await vscode.window.showInputBox({
    title: 'AS2 Client Search',
    value: defaultValue,
  }) || '').replace(/^https?:\/\//, '');

  if (query) {
    const results = await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Finding Clients...",
      cancellable: true,
    }, () => ghSearch(query));
    
    const options = results.map(result => ({
      ...result,
      label: `${result.key}: ${result.CLIENT_NAME} (${result.type})`,
      detail: result.domain,
    }));
    
    if (!options?.length) {
      return vscode.window.showInformationMessage(`No Clients found`);
    }

    const selection = options.length > 1 ? await vscode.window.showQuickPick(options, { matchOnDetail: true }) : options[0];
    if (!selection) {
      return;
    }

    const actions = [
      {
        label: '$(globe) View Website',
        detail: selection.domain,
        onSelect: () => {
          vscode.env.openExternal(vscode.Uri.parse(selection.domain));
        },
        buttons: [{
          tooltip: 'Copy to clipboard',
          iconPath: new vscode.ThemeIcon('files'),
          onSelect: () => vscode.env.clipboard.writeText(selection.domain)
        }],
      },
      {
        label: '$(file-code) Open Project',
        detail: selection.localPath,
        buttons: [{
          tooltip: 'Copy to clipboard',
          iconPath: new vscode.ThemeIcon('files'),
          onSelect: () => vscode.env.clipboard.writeText(selection.localPath),
        }],
        onSelect: () => openLocalProject(selection),
      },
      {
        label: '$(repo) Github.com',
        detail: selection.repo,
        onSelect: () => vscode.env.openExternal(vscode.Uri.parse(selection.repo)),
        buttons: [{
          tooltip: 'Copy to clipboard',
          iconPath: new vscode.ThemeIcon('files'),
          onSelect: () => vscode.env.clipboard.writeText(selection.repo)
        }],
      },
      {
        label: '$(github) Github.dev',
        detail: selection.repo.replace('.com', '.dev'),
        onSelect: () => vscode.env.openExternal(vscode.Uri.parse(selection.repo.replace('.com', '.dev'))),
        buttons: [{
          tooltip: 'Copy to clipboard',
          iconPath: new vscode.ThemeIcon('files'),
          onSelect: () => vscode.env.clipboard.writeText(selection.repo.replace('.com', '.dev')),
        }],
      },
      {
        label: '$(console) Connect to DB',
        detail: `ssh root@${selection.db}`,
        buttons: [{
          tooltip: 'Copy to clipboard',
          iconPath: new vscode.ThemeIcon('files'),
          onSelect: () => vscode.env.clipboard.writeText(selection.db),
        }],
        onSelect: () => runTerminalCommand(`ssh root@${selection.db}`, { name: `${selection.key} (AS2)`, ttl: 0 }),
      },
      {
        label: '$(gear) View Env',
        detail: selection.githubUrl,
        onSelect: () => vscode.env.openExternal(vscode.Uri.parse(selection.githubUrl)),
        buttons: [{
          tooltip: 'Copy to clipboard',
          iconPath: new vscode.ThemeIcon('files'),
          onSelect: () => vscode.env.clipboard.writeText(selection.githubUrl),
        }],
      },
      {
        label: '$(info) Get info',
        detail: `${selection.key} (cluster ${selection.cluster} ${selection.type}) - ${selection.domain}: ${selection.db}`,
        onSelect: () => {
          console.log(JSON.stringify(selection, undefined, 2));
          vscode.window.showInformationMessage(JSON.stringify(selection, undefined, 2), 'Copy').then(copy => {
            if (copy) {
              vscode.env.clipboard.writeText(JSON.stringify(selection, undefined, 2));
            }
          });
        },
        buttons: [
          {
            tooltip: 'Copy Key',
            iconPath: new vscode.ThemeIcon('key'),
            onSelect: () => vscode.env.clipboard.writeText(selection.key),
          },
          {
            tooltip: 'Copy Cluster',
            iconPath: new vscode.ThemeIcon('server-environment'),
            onSelect: () => vscode.env.clipboard.writeText(selection.cluster?.toString()),
          },
          {
            tooltip: 'Copy Domain',
            iconPath: new vscode.ThemeIcon('globe'),
            onSelect: () => vscode.env.clipboard.writeText(selection.domain),
          },
          {
            tooltip: 'Copy Database IP',
            iconPath: new vscode.ThemeIcon('database'),
            onSelect: () => vscode.env.clipboard.writeText(selection.DB_IP_ADDR),
          },
        ]
      },
    ];

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = actions;
    quickPick.title = `${selection.key} (cluster ${selection.cluster} ${selection.type}) - ${selection.domain}: ${selection.db}`;
    quickPick.ignoreFocusOut = true;
    quickPick.matchOnDetail = true;
    quickPick.show();
    quickPick.onDidAccept(() => {
      (quickPick?.selectedItems as any)?.[0]?.onSelect?.();
      quickPick.dispose();
    });
    quickPick.onDidTriggerItemButton(({ button }: any) => button?.onSelect?.());
  }
}