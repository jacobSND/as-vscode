import * as vscode from 'vscode';
import { search as ghSearch } from '../github';
import { auctionSearch } from '../as2';

export function registerChatTools(context: vscode.ExtensionContext) {
  const get_clients: vscode.LanguageModelTool<{ query: string }> = {
    async invoke(options: vscode.LanguageModelToolInvocationOptions<{ query: string }>): Promise<vscode.LanguageModelToolResult> {
      try {
        const query = options.input?.query?.trim();
        
        if (!query) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('Error: Search query is required')
          ]);
        }

        const searchResults = await ghSearch(query);
        
        if (!searchResults.length) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`No clients found matching "${query}"`)
          ]);
        }

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(JSON.stringify(searchResults, null, 2))
        ]);
      } catch (error) {
        console.error('Search tool error:', error);
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Error searching for clients: ${error instanceof Error ? error.message : 'Unknown error'}`)
        ]);
      }
    }
  };

  type GetAuctionsToolInput = { client_domain: string, variables: Record<string, unknown>};
  const get_auctions: vscode.LanguageModelTool<GetAuctionsToolInput> = {
    async invoke(options: vscode.LanguageModelToolInvocationOptions<GetAuctionsToolInput>): Promise<vscode.LanguageModelToolResult> {
      try {
        const api_url = options.input?.client_domain?.trim() + '/api';
        const variables = options.input?.variables || {};
        
        if (!api_url) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('Error: Client domain is required')
          ]);
        }

        const response = await auctionSearch(api_url, variables);
        const auctions = response?.auctions?.auctions || [];

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(JSON.stringify(auctions, null, 2))
        ]);
      } catch (error) {
        console.error('Auctions tool error:', error);
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(`Error fetching auctions: ${error instanceof Error ? error.message : 'Unknown error'}`)
        ]);
      }
    }
  };

  context.subscriptions.push(vscode.lm.registerTool('search_as_clients', get_clients));
  context.subscriptions.push(vscode.lm.registerTool('search_as_auctions', get_auctions));
}