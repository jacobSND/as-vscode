import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";
import { getOverrides } from './utilities/overrides';

const GITHUB_AUTH_PROVIDER_ID = 'github';
const SCOPES = ['user:email', 'repo'];
const BRANCH = 'master';
export const OWNER = 'AuctionSoft';
export const REPO = 'as2-clients';
let gh: Octokit | undefined = undefined;
let subscription: any = undefined;

function registerListeners() {
  if (!subscription) { // handle login/out
    subscription = vscode.authentication.onDidChangeSessions(async e => {
      if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
        await getGh(false);
      }
    });
  }
}

async function getGh(createIfNone = true): Promise<Octokit> {
  if (gh) {
    return gh;
  }

  const session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone });
  if (!session?.accessToken) {
    vscode.window.showErrorMessage('GitHub access denied');
  }
  gh = new Octokit({ auth: session!.accessToken });
  registerListeners();

  return gh;
}

function buildEnv(data: any) {
  return data?.match(/^export\s+([^=]+)=(.*)$/gm)?.reduce((parts: any, part: any) => {
    const [name, value] = part.replace('export ', '').split('=');
    parts[name] = value.replace(/"/g, '');
    return parts;
  }, {});
}

export async function getRepo() {
  const gh = await getGh();
  const branch = await gh.rest.repos.getBranch({
    branch: BRANCH,
    owner: OWNER,
    repo: REPO,
  });
  
  const contents = await gh.rest.git.getTree({
    owner: OWNER,
    repo: REPO,
    recursive: "true",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tree_sha: branch.data.commit.commit.tree.sha
  });

  return contents.data.tree;
}

async function getEnv(path: string) {
  const gh = await getGh();
  const result: any = await gh.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    mediaType: {
      format: 'raw',
    },
  });
  
  return buildEnv(result.data);
}

export async function search(query: string) {
  const results: any[] = [];
  try {
    const settings = vscode.workspace.getConfiguration('as2.clients');

    const gh = await getGh();
    const searchResults = await gh.request('GET /search/code', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      q: `${query}+repo:${OWNER}/${REPO}`,
    });
    for (const result of searchResults.data.items || []) {
      const [_, type, key] = result.path.match(/^(client|custom|disabled_client)_env\/(.+)\.env$/i) || [];
      const env = key ? await getEnv(result.path) : null;
      if (env) {
        const clientKey = env.IMAGE_KEY || env.APP_NAME || env.WEBSITE_KEY;
        let localPath: string = type === 'client'
          ? settings.core
          : `${settings.custom}/${clientKey}-auctionsoftware`;

        const db_identifying_octet = env.DB_IP_ADDR.split('.')[2]; // TODO: find a better way to automatically determine cluster
        const cluster = db_identifying_octet.startsWith('11') ? Number(db_identifying_octet.slice(-1)) + 1 : undefined;

        const client = {
          ...env,
          label: key || result.path || '',
          key: key.toLowerCase(),
          name: env.CLIENT_NAME,
          githubUrl: result.html_url,
          type: type === 'client' ? 'core' : type,
          cluster,
          domain: `${env.APP_DEFAULT_PROTOCOL || 'https'}://${env.APP_HOSTNAME}`,
          db: `${env.DB_IP_ADDR}`,
          repo: type === 'client'
            ? 'https://github.com/AuctionSoft/auctionsoftware'
            : `https://github.com/AuctionSoft/${env.IMAGE_KEY || env.APP_NAME || env.WEBSITE_KEY}-auctionsoftware`,
          localPath,
        };

        const overrides = await getOverrides(settings.overrides, client);
        if (client.type === 'custom') {
          const jenkinsLink = overrides?.links?.find((link: any) => link.text === 'Jenkins');
          if (jenkinsLink) {
            jenkinsLink.url = jenkinsLink.url + `job/${client.key}-auctionsoftware/`;
          }
        }
        results.push({ ...client, ...overrides });
      }
    }
  } catch (e: any) {
    vscode.window.showWarningMessage(`Github Error: ${e?.message || 'Unknown error'}`);
  }
  return results;
}
