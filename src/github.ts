import * as vscode from 'vscode';
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { getOverrides } from './utilities/overrides';
import { poll } from './utilities/poll';
import { ErrorWithOptions } from './utilities/error';

const AUTH_PROVIDER = 'github';
const SCOPES = ['user:email', 'repo', 'workflow'];
const BRANCH = 'master';
export const OWNER = 'AuctionSoft';
export const REPO = 'as2-clients';
let gh: Octokit | undefined = undefined;
let subscription: any = undefined;

function registerListeners() {
  if (!subscription) { // handle login/out
    subscription = vscode.authentication.onDidChangeSessions(async e => {
      if (e.provider.id === AUTH_PROVIDER) {
        await getGh({ createIfNone: false });
      }
    });
  }
}

async function getGh(options: vscode.AuthenticationGetSessionOptions): Promise<Octokit> {
  if (gh) return gh;

  const session = await vscode.authentication.getSession(AUTH_PROVIDER, SCOPES, options);
  if (!session?.accessToken) {
    throw new Error('GitHub access denied');
  }
  gh = new Octokit({ auth: session.accessToken });
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

async function getEnv(path: string) {
  const gh = await getGh({ createIfNone: true });
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

    const gh = await getGh({ createIfNone: true });
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
        const logLink = overrides?.links?.find((link: any) => link.text === 'Logs');
        if (logLink) {
          logLink.url = logLink.url + `/namespace/${client.key}/logs?var-ds=aee2awjusqhogd&var-filters=namespace%7C%3D%7C${client.key}`;
        }
        results.push({ ...client, ...overrides });
      }
    }
  } catch (e: any) {
    vscode.window.showWarningMessage(`Github Error: ${e?.message || 'Unknown error'}`);
  }
  return results;
}

export function actionsLink(client_key: string) {
  return `https://github.com/${OWNER}/${client_key}-auctionsoftware/actions`;
}

export async function startWorkflow(client_key: string, type: 'update' | 'deploy', cancellationToken?: vscode.CancellationToken) {
  const gh = await getGh({ createIfNone: true });
  const commonRequestParams = {
    owner: OWNER,
    repo: `${client_key}-auctionsoftware`,
    workflow_id: `${type}.yml`,
  };
  const minutes = (minutes: number) => 60 * 1000 * minutes;
  const timeouts = {
    start: minutes(0.5),
    update: minutes(5),
    deploy: minutes(30),
  };

  const actions_link = actionsLink(client_key);
  type WorkflowFilter = RestEndpointMethodTypes['actions']['listWorkflowRuns']['parameters'] & {
    statuses?: RestEndpointMethodTypes['actions']['listWorkflowRuns']['parameters']['status'][]
  };
  const getWorkflows = async ({ statuses = [undefined], ...parameters }: Partial<WorkflowFilter>) => {
    type WorkflowRun = RestEndpointMethodTypes["actions"]["listWorkflowRuns"]["response"]['data']['workflow_runs'][0];
    return (await Promise.all(
      statuses.map(status => gh.actions.listWorkflowRuns({
        ...commonRequestParams,
        ...parameters,
        status,
      }))
    )).reduce((runs, { data: { workflow_runs } }) => [...runs, ...workflow_runs], [] as WorkflowRun[]);
  };

  const activeRuns = await getWorkflows({ statuses: ['in_progress', 'queued'] });
  if (activeRuns.length) {
    throw new ErrorWithOptions(`There is already an active ${type} workflow`, { link: actions_link + `/runs/${activeRuns[0].id}` });
  }

  // Start the workflow
  await gh.actions.createWorkflowDispatch({ ref: BRANCH, ...commonRequestParams });

  // wait for the workflow to start
  const pendingWorkflow = await poll(async () => {
    return (await getWorkflows({ statuses: ['queued', 'in_progress'] }))[0];
  }, { timeout: timeouts.start, interval: timeouts.start / 5, cancellationToken });

  const startedWorkflow = pendingWorkflow?.status !== 'queued' ? pendingWorkflow : (
    // all workers are busy, continue waiting for the workflow to start
    await poll(async () => {
      return (await getWorkflows({ statuses: ['in_progress'] }))[0];
    }, { timeout: timeouts.update, cancellationToken })
  );

  if (startedWorkflow?.status !== 'in_progress') {
    throw new ErrorWithOptions(`Unable to find a pending ${type} workflow...`, { link: actions_link });
  }

  // Wait for the workflow to complete
  const completedWorkflow = await poll(async () => {
    const [completedWorkflowRun] = await getWorkflows({ run_id: startedWorkflow.id });
    return completedWorkflowRun.status === 'completed' ? completedWorkflowRun : undefined;
  }, { timeout: timeouts[type], cancellationToken });

  if (!completedWorkflow) {
    throw new ErrorWithOptions(`Timeout waiting for workflow run ${startedWorkflow.id} to complete`, { link: actions_link + `/runs/${startedWorkflow.id}` });
  } else {
    if (completedWorkflow.conclusion !== 'success') {
      throw new ErrorWithOptions(`${type} workflow ${completedWorkflow.conclusion}`, { link: completedWorkflow.html_url });
    }
  }
}