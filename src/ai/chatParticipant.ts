import * as vscode from 'vscode';
import { awaitStream, parseJsonResponse, parseTextResponse } from '../utilities/stream';

let project_info: string | undefined;
let toolsContext: ToolsContext;

export function registerChatParticipant(extensionContext: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant('as', async (request, chatContext: vscode.ChatContext, stream, token) => {
    try {
      if (!project_info) {
        project_info = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(extensionContext.extensionUri, 'src', 'ai', 'instructions.md')).then(buffer => buffer.toString());
      }

      if (!toolsContext || chatContext.history.length === 0) {
        toolsContext = {
          client_search_query: '',
          clients: undefined,
          auctions: undefined,
          toolsToCall: new Set([]),
        };
      }

      toolsContext.toolsToCall = parseToolCalls(request);
      await answerQuestion(request, token, stream, chatContext, toolsContext);
    } catch (error) {
      console.error('Chat participant error:', error);
      stream.markdown(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  });

  participant.iconPath = vscode.Uri.joinPath(extensionContext.extensionUri, 'resources', 'AS-chat.png');
  extensionContext.subscriptions.push(participant);
}

function parseToolCalls(request: vscode.ChatRequest): ToolSet {
  const toolCalls: ToolSet = new Set(request.toolReferences.map(ref => ({ name: ref.name })));
  if (request.command === 'searchClients') {
    toolCalls.add({ name: 'search_as_clients' });
  }
  return toolCalls;
}

async function parseInput(request: vscode.ChatRequest, token: vscode.CancellationToken, toolContext: ToolsContext): Promise<ParsedInput> {
  const userMessage = request.prompt.trim();
  const { client_search_query, toolsToCall } = toolContext;

  let parsedInput: ParsedInput = {} as ParsedInput;
  if (toolsToCall.size) {
    const input_parsing_prompt = `
      Current date: ${new Date().toISOString()}
      Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
      Extract structured data from this user query: "${userMessage}"
      
      You must respond with ONLY valid JSON in this exact format:
      {
        "subject": "string or empty string",
        "auction_search": null or {
          "search": {
            "text": string
          },
          "count": null or number,
          "order": {
            "column": "start_time|end_time|type|auction_status",
            "direction": "asc|desc"
          },
          "filter": {
            "start_time_from": "ISO 8601 date string",
            "start_time_to": "ISO 8601 date string",
            "end_time_from": "ISO 8601 date string", 
            "end_time_to": "ISO 8601 date string", 
            "type": "online|live|multipar|listing|real-estate-listing|sealed|cascading|dutch|mixed|phone-bidoff",
            "auction_status": [-100, 0, 50, 100, 200, 300, 400]
          }
        }
      }

      Rules:
      - subject: client name, domain, IP, cluster number, or 2-5 char key (empty string if none). convert to singular form if plural.
      - auction_search: null if not searching auctions, otherwise object with optional properties
      - search.text: optional text to search in auctions (IMPORTANT: do not use the subject, only use if the user asks about titles or descriptions)
      - count defaults to 10, order.column defaults to 'end_time', auction_status defaults to [100, 200]
      - auction_status: -100 (Removed), 0 (Not Ready), 50 (Queued), 100 (Preview), 200 (Active), 300 (Completed), 400 (Archived). Unless specified, return [100, 200].
      - Do not mix start_time_* and end_time_* filters
      - Unless specified, use end_time_* filters when asked about auctions relative to dates
      - Unless specified, filter.type should be omitted (all types)
      - Do not include explanatory text, markdown, or code blocks - only the valid JSON object
    `;

    parsedInput = await request.model.sendRequest(
      [vscode.LanguageModelChatMessage.User(input_parsing_prompt)], {}, token,
    ).then(awaitStream).then(parseJsonResponse);
  }

  toolContext.client_search_query = parseTextResponse(parsedInput?.subject) || client_search_query;

  if (!!parsedInput.auction_search) {
    toolContext.toolsToCall.add({ name: 'search_as_auctions' });
    
    if (parsedInput.auction_search?.search?.text && parsedInput.auction_search?.search?.text === client_search_query) {
      parsedInput.auction_search.search.text = ''; 
    }
  }

  return {
    userMessage,
    ...parsedInput
  };
}

async function searchClients(
  request: vscode.ChatRequest,
  token: vscode.CancellationToken,
  stream: vscode.ChatResponseStream,
  { client_search_query, clients, toolsToCall }: ToolsContext
): Promise<Clients> {
  const searchClientsTool = Array.from(toolsToCall).find(tool => tool.name === 'search_as_clients');
  if (!searchClientsTool) {
    return clients;
  }

  stream.progress(`🔍 Searching for clients...`);
  if (!client_search_query) {
    throw new Error(`❌ Error: Unable to find this client.`);
  }

  const result = ((await vscode.lm.invokeTool('search_as_clients', {
    input: searchClientsTool.input || { query: client_search_query },
    toolInvocationToken: request.toolInvocationToken
  }, token))?.content?.[0] as vscode.LanguageModelTextPart)?.value;

  toolsToCall.delete(searchClientsTool);

  if (result.startsWith('Error:') || result.startsWith('No clients found')) {
    throw new Error(`❌ ${result}`);
  }

  try {
    const clients = JSON.parse(result);
    if (!Array.isArray(clients) || clients.length === 0) {
      stream.markdown(`❌ No clients found for "${client_search_query}".`);
      return [];
    }
    if (clients.length > 1) {
      stream.markdown(`🔍 Found ${clients.length} clients for "${client_search_query}". \n`);
    }
    return clients;
  } catch (error) {
    throw new Error(`❌ Error parsing search results: ${(error instanceof Error ? error.message : 'Unknown error')}`, { cause: error });
  }
}

async function searchAuctions(
  auctionSearch: Record<string, unknown> | undefined,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken,
  stream: vscode.ChatResponseStream,
  toolsContext: ToolsContext
): Promise<Auctions> {
  const { clients, auctions, toolsToCall } = toolsContext;
  const searchAuctionsTool = Array.from(toolsToCall).find(tool => tool.name === 'search_as_auctions');
  if (!searchAuctionsTool) {
    return auctions;
  }

  if (!clients?.length) {
    throw new Error(`❌ Error: Cannot search auctions without a valid client. Please refine your query to identify a specific client.`);
  }

  stream.progress(`🔍 Searching for auctions...`);
  const result = ((await vscode.lm.invokeTool('search_as_auctions', {
    input: {
      client_domain: clients[0]?.domain,
      variables: auctionSearch || {}
    },
    toolInvocationToken: request.toolInvocationToken
  }, token))?.content?.[0] as vscode.LanguageModelTextPart)?.value;

  toolsContext.toolsToCall.delete(searchAuctionsTool);
  
  if (result.startsWith('Error:') || result.startsWith('No auctions found')) {
    throw new Error(`❌ ${result}`);
  }
  return JSON.parse(result);
}

async function answerQuestion(
  request: vscode.ChatRequest,
  token: vscode.CancellationToken,
  stream: vscode.ChatResponseStream,
  chatContext: vscode.ChatContext,
  toolsContext: ToolsContext
) {
  const { client_search_query, clients, auctions } = toolsContext;

  const parsedInput = await parseInput(request, token, toolsContext);
  toolsContext.clients = await searchClients(request, token, stream, toolsContext);
  toolsContext.auctions = await searchAuctions(parsedInput.auction_search, request, token, stream, toolsContext);

  if (!chatContext.history.length && toolsContext.client_search_query) {
    let message = `💡 Answering based on data for "${toolsContext.client_search_query}"`;
    if (parsedInput.auction_search) {
      message += ` and their auctions`;
    }
    stream.progress(message + '...');
  }

  const message = vscode.LanguageModelChatMessage.User(`
    You are an expert assistant helping a user with their questions about the auctioneer software project, clients and auctions.
    Use the provided data to answer the question as best you can. Be concise and to the point.
    If you don't know the answer, just say you don't know. Do not make up an answer.
    Current date: ${new Date().toISOString()}
    Convert utc timestamps to ${Intl.DateTimeFormat().resolvedOptions().timeZone}
    project info: ${project_info}
    ${clients?.length && `
      clients: ${JSON.stringify(clients)}
      The clients data is an array of one or more clients.
      Important: The clients are search results from the subject "${client_search_query}". If the subject of the question does not seem to relate to this subject, remind the user to "use /clientSearch lookup a new client".
      Questions about whether the client is core or custom should refer to the "type" property.
    `}
    ${auctions && `
      auctions: ${JSON.stringify(auctions)}
      The auctions data is an array of auctions for the client "${client_search_query}".
    `}
    Question: "${parsedInput.userMessage}"
    Answer:
  `);

  
  toolsContext.toolsToCall.clear();
  await request.model.sendRequest([message], {
    tools: vscode.lm.tools.filter(tool => tool.tags.includes('as')),
  }, token).then((response) => awaitStream({
    ...response,
    onText: (part) => stream.markdown(part.value),
    onTool: (part) => toolsContext.toolsToCall.add(part),
  }));

  if (toolsContext.toolsToCall.size) {
    const parsed = await parseInput(request, token, toolsContext);
    toolsContext.clients = await searchClients(request, token, stream, toolsContext);
    toolsContext.auctions = await searchAuctions(parsed.auction_search, request, token, stream, toolsContext);
    await answerQuestion(request, token, stream, chatContext, toolsContext);
  }
}

type Tool = Partial<vscode.LanguageModelToolCallPart>;
type ToolSet = Set<Tool>;

type Client = Record<string, unknown>;
type Clients = Client[] | undefined;

type Auction = Record<string, unknown>;
type Auctions = Auction[] | undefined;

type ToolsContext = {
  client_search_query: string;
  clients: Clients;
  auctions: Auctions;
  toolsToCall: ToolSet;
};

type ParsedInput = {
  userMessage?: string;
  subject?: string;
  auction_search?: {
    search?: {
      text?: string;
    };
    count?: number;
    order?: {
      column: 'start_time' | 'end_time' | 'type' | 'auction_status';
      direction: 'asc' | 'desc';
    };
    filter?: {
      start_time_from?: string;
      start_time_to?: string;
      end_time_from?: string; 
      end_time_to?: string; 
      type?: 'online' | 'live' | 'multipar' | 'listing' | 'real-estate-listing' | 'sealed' | 'cascading' | 'dutch' | 'mixed' | 'phone-bidoff';
      auction_status?: number[];
    };
  };
};