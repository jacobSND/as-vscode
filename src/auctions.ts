import { JSDOM } from 'jsdom';

const BASE_URL = 'http://192.168.77.177';
export async function getAuctionsURL(client: Client) {
  const client_id = client.internal_db_id ?? await getClientId(client);
  if (!client_id) {
    throw new Error('Could not find client');
  }
  return `${BASE_URL}/clients/${client_id}`;
}

async function getClientId(client: Client) {
  const response = await fetch(`${BASE_URL}/clients?clients.search=${client.key}`);
  const htmlText = await response.text();

  const clientsTable = (new JSDOM(htmlText)).window.document.getElementById('client-results');
  if (!clientsTable) {
    throw new Error('Could not find clients table');
  }

  const clientRows = Array.from(clientsTable.querySelectorAll('tr') || []);
  const headers = (Array.from(clientRows.shift()?.querySelectorAll('th') || [])).map((th: HTMLElement, index) => th.dataset?.col || th.textContent?.trim() || 'actions');
  const clients: Record<string, string>[] = clientRows.map(row => {
    const rowData: Record<string, string> = {};
    Array.from(row.querySelectorAll('th, td') || []).forEach((cell, cellIndex) => {
      const header = headers[cellIndex];
      rowData[header] = header === 'actions'
        ? cell.querySelector('a')?.getAttribute('href') || ''
        : cell.textContent?.trim() || '';
    });

    return rowData;
  });

  const clientRow = clients.find(c => {
    const cluster = c.cluster.match(/(?:kub-c(\d+)|^(\w+))/);
    const clusterMatch = [cluster?.[1], cluster?.[2]].includes(client.cluster.toString().toLowerCase());
    return c.key === client.key && clusterMatch;
  });
  const internal_db_id = clientRow?.actions.replace('/clients/', '');
  // TODO: update client with internal_db_id?
  return internal_db_id;
}

type Client = any;