import * as vscode from 'vscode';
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { getOverrides } from './utilities/overrides';

const AUTH_PROVIDER = 'github';
const SCOPES = ['user:email', 'repo', 'workflow'] as const;
const BRANCH = 'master';
export const OWNER = 'AuctionSoft';
export const REPO = 'as2-clients';
let gh: Octokit | undefined = undefined;

async function getGh(options: vscode.AuthenticationGetSessionOptions): Promise<Octokit> {
  if (gh) return gh;

  const session = await vscode.authentication.getSession(AUTH_PROVIDER, SCOPES, options);
  if (!session?.accessToken) {
    throw new Error('GitHub access denied');
  }
  return new Octokit({ auth: session.accessToken });
}

function buildEnv(data: string): EnvData {
  const matches = data?.match(/^export\s+([^=]+)=(.*)$/gm);
  return matches?.reduce((parts: EnvData, part: string) => {
    const [name, value] = part.replace('export ', '').split('=');
    parts[name] = value.replace(/"/g, '');
    return parts;
  }, {}) ?? {};
}

export async function getRepo(): Promise<RestEndpointMethodTypes["git"]["getTree"]["response"]["data"]["tree"]> {
  const gh = await getGh({ createIfNone: true });
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

async function getEnv(path: string): Promise<EnvData> {
  const gh = await getGh({ createIfNone: true });
  const result = await gh.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    mediaType: {
      format: 'raw',
    },
  });
  
  // When mediaType format is 'raw', the result.data will be a string
  if (typeof result.data === 'string') {
    return buildEnv(result.data);
  }

  throw new Error('Expected string content from GitHub API');
}

export async function search(query: string): Promise<ClientWithOverrides[]> {
  const results: ClientWithOverrides[] = [];
  try {
    const settings = vscode.workspace.getConfiguration('as2.clients');

    const gh = await getGh({ createIfNone: true });
    const searchResults = await gh.request('GET /search/code', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      q: `${query}+repo:${OWNER}/${REPO}`,
    });

    for (const result of searchResults.data.items || []) {
      const pathMatch = result.path.match(/^(client|custom|disabled_client)_env\/(.+)\.env$/i);
      if (!pathMatch) continue;

      const [, type, key] = pathMatch;
      const env = key ? await getEnv(result.path) : null;
      if (env) {
        const clientKey = env.IMAGE_KEY || env.APP_NAME || env.WEBSITE_KEY;
        const localPath: string = type === 'client'
          ? settings.core
          : `${settings.custom}/${clientKey}-auctionsoftware`;

        const dbIpParts = env.DB_IP_ADDR?.split('.');
        const db_identifying_octet = dbIpParts?.[2]; // TODO: find a better way to automatically determine cluster
        const cluster = db_identifying_octet?.startsWith('11')
          ? Number(db_identifying_octet.slice(-1)) + 1
          : undefined;

        const repoName = type === 'client' ? 'auctionsoftware' : `${env.IMAGE_KEY || env.APP_NAME || env.WEBSITE_KEY}-auctionsoftware`;

        const client: Client = {
          ...env,
          label: key || result.path || '',
          key: key.toLowerCase(),
          name: env.CLIENT_NAME || '',
          githubUrl: result.html_url,
          type: (type === 'client' ? 'core' : type) as Client['type'],
          cluster,
          domain: `${env.APP_DEFAULT_PROTOCOL || 'https'}://${env.APP_HOSTNAME}`,
          db: env.DB_IP_ADDR || '',
          repo: ['https://github.com', OWNER, repoName].join('/'),
          repoOwner: OWNER,
          repoName,
          localPath,
        };

        const overrides = await getOverrides(settings.overrides, client);
        if (client.type === 'custom') {
          const jenkinsLink = overrides?.links?.find((link: ClientLink) => link.text === 'Jenkins');
          if (jenkinsLink) {
            jenkinsLink.url = jenkinsLink.url + `job/${client.key}-auctionsoftware/`;
          }
        }
        const logLink = overrides?.links?.find((link: ClientLink) => link.text === 'Logs');
        if (logLink) {
          logLink.url = logLink.url + `/namespace/${client.key}/logs?var-ds=aee2awjusqhogd&var-filters=namespace%7C%3D%7C${client.key}`;
        }

        const clientWithOverrides: ClientWithOverrides = {
          ...client,
          ...overrides,
        };

        results.push(clientWithOverrides);
      }
    }
  } catch (e) {
    const error = e as Error;
    vscode.window.showWarningMessage(`Github Error: ${error?.message || 'Unknown error'}`);
  }
  return results;
}

export function actionsLink(client_key: string) {
  return `https://github.com/${OWNER}/${client_key}-auctionsoftware/actions`;
}

type WorkflowInputs = { [key: string]: unknown } | undefined;
export async function startWorkflow(client_key: string, type: 'update' | 'deploy', inputs?: WorkflowInputs) {
  const gh = await getGh({ createIfNone: true });

  return gh.actions.createWorkflowDispatch({
    owner: OWNER,
    repo: `${client_key}-auctionsoftware`,
    workflow_id: `${type}.yml`,
    ref: BRANCH,
    inputs,
  });
}

interface EnvData {
  [key: string]: string;
}

interface ClientLink {
  text: string;
  url: string;
}

export interface Client {
  label: string;
  key: string;
  name: string;
  githubUrl: string;
  type: 'core' | 'custom' | 'disabled_client';
  cluster?: number | string;
  domain: string;
  db: string;
  repo: string;
  repoOwner: string;
  repoName: string;
  localPath: string;
}

interface ClientWithOverrides extends Omit<Client, 'cluster'> {
  identifier?: string;
  sshUser?: string;
  links?: ClientLink[];
  cluster?: number | string;
  [key: string]: unknown;
}