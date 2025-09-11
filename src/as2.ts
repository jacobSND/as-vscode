export async function auctionSearch(api_url: string, variables: { search?: string, filter?: AuctionFilterInput, count?: number } = {}) {
  const results = await graphqlRequest(api_url, {
    query: /* GraphQL */ `
      query get_auctions(
        $search: AuctionSearchInput,
        $filter: AuctionFilterInput,
        $count: Int = 10
      ) {
        auctions(
          search: $search,
          filter: $filter,
          pagination: { page: 1, pageSize: $count}
        ) {
          total
          auctions {
            auction_id
            title
            start_time
            end_time
            type
            auction_status
            public_url
            admin_url
          }
        }
      }
    `,
    variables,
  });
  return results;
}

async function graphqlRequest(api_url: string, data: { query: string, variables?: Record<string, unknown> }) {
  const response = await fetch(api_url, {
    method: 'post',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  if (responseData.errors) {
    throw new Error(`GraphQL request failed: ${JSON.stringify(responseData.errors)}`);
  }

  return responseData.data;
}

const AUCTION_STATUSES = {
  'Removed': -100,
  'Not Ready': 0,
  'Queued': 50,
  'Preview': 100,
  'Active': 200,
  'Completed': 300,
  'Archived': 400,
} as const;

const AUCTION_TYPES = {
  'Online': 'online',
  'Live': 'live',
  'Multipar': 'multipar',
  'Listing': 'listing',
  'Real Estate Listing': 'real-estate-listing',
  'Sealed Bid': 'sealed',
  'Cascading': 'cascading',
  'Dutch': 'dutch',
  'Mixed': 'mixed',
  'Phone Bidoff': 'phone-bidoff',
} as const;

type AuctionFilterInput = {
  start_time_from?: string;
  start_time_to?: string;
  end_time_from?: string;
  end_time_to?: string;
  auction_status?: (typeof AUCTION_STATUSES)[keyof typeof AUCTION_STATUSES];
  type?: (typeof AUCTION_TYPES)[keyof typeof AUCTION_TYPES];
};