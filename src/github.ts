import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";

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
  const settings = vscode.workspace.getConfiguration('as2.clients');

  const gh = await getGh();
  const searchResults = await gh.rest.search.code({
    q: `q=${query}+repo:${OWNER}/${REPO}`,
  });
  const results: any[] = [];
  for (const client of searchResults.data.items || []) {
    const [_, type, key] = client.path.match(/^(client|custom|disabled_client)_env\/(.+)\.env$/i) || [];
    const env = key ? await getEnv(client.path) : null;
    if (env) {
      const clientKey = env.IMAGE_KEY || env.APP_NAME || env.WEBSITE_KEY;
      let localPath: string = type === 'client'
        ? settings.core
        : `${settings.custom}/${clientKey}-auctionsoftware`;

      if (settings.path_overrides?.[clientKey]) {
        localPath = settings.path_overrides[clientKey];
      }

      results.push({
        ...env,
        label: key || client.path || '',
        key: key.toLowerCase(),
        name: env.CLIENT_NAME,
        githubUrl: client.html_url,
        type: type === 'client' ? 'core' : type,
        cluster: Number(env.DB_IP_ADDR.split('.')[2].slice(-1))+1,
        domain: `${env.APP_DEFAULT_PROTOCOL || 'https'}://${env.APP_HOSTNAME}`,
        db: `${env.DB_IP_ADDR}`,
        repo: type === 'client'
          ? 'https://github.com/AuctionSoft/auctionsoftware'
          : `https://github.com/AuctionSoft/${env.IMAGE_KEY || env.APP_NAME || env.WEBSITE_KEY}-auctionsoftware`,
        localPath,
      });
    }
  }
  return results;
}
