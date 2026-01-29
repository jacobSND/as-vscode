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

function isDomain(query: string): boolean {
  const cleanQuery = query.replace(/^https?:\/\//, '');
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return domainPattern.test(cleanQuery);
}

async function fetchWebsiteKey(domain: string): Promise<string | null> {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;

    const response = await fetch(`${url}/api/about`, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (compatible; VSCode-AS2-Extension/1.0)"
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.website_key;
  } catch (e) {
    // Silently fail if the domain doesn't respond or doesn't have /api/about
    return null;
  }
}

export async function search(query: string, onResult?: (results: (ClientWithOverrides | null)[]) => void) {
  try {
    const settings = vscode.workspace.getConfiguration('as2.clients');

    const gh = await getGh({ createIfNone: true });
    const searchResults = await gh.request('GET /search/code', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      q: `${query}+repo:${OWNER}/${REPO}`,
    });

    const pathRegex = /^(client|custom|disabled_client)_env\/(.+)\.env$/i;
    const results = (searchResults.data.items || []).filter(item => item.path.match(pathRegex));
    // pre-fill array for accurate UI count on client with partial results
    const items: (ClientWithOverrides | null)[] = new Array(results.length).fill(null);

    for (const [index, result] of results.entries()) {
      try {
        const pathMatch = result.path.match(pathRegex);
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
          const logLink = overrides?.links?.find((link) => link.text === 'Logs');
          if (logLink) {
            logLink.url = logLink.url + `/namespace/${client.key}/logs?var-ds=aee2awjusqhogd&var-filters=namespace%7C%3D%7C${client.key}`;
          }

          const graphLink = overrides?.links?.find((link) => link.text === 'Graphs');
          if (graphLink) {
            graphLink.url = graphLink.url + `?var-namespace=${client.key}`;
          }

          const clientWithOverrides: ClientWithOverrides = {
            ...client,
            ...overrides,
          };

          items[index] = clientWithOverrides;
          onResult?.(items);
        }
      } catch (error) {
        console.error('Error processing search result:', error);
      }
    }

    // If no results found and query looks like a domain, try affiliate domain fallback
    if (results.length === 0 && isDomain(query)) {
      const websiteKey = await fetchWebsiteKey(query);
      if (websiteKey) {
        return await search(`${websiteKey}-`, onResult);
      }
    }
  } catch (e) {
    const error = e as Error;
    vscode.window.showWarningMessage(`Github Error: ${error?.message || 'Unknown error'}`);
  }
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