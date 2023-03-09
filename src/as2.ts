import axios from 'axios';

const auth = {
  skip: false,
};

export async function getAuctions(client: Client) {
  const results = await request(client, {
    query: /* GraphQL */ `{
      auctions {
        total,
        auctions {
          auction_id,
          title,
        },
      },
    }`,
  });
  return results;
}


type Data = {
  query: string,
  variables?: any,
};
async function request(client: Client, data: Data) {
  const response = await axios({
    url: `https://as2.auctioneersoftware.com/api`,
    method: 'post',
    data,
    // headers: {
    //   authorization: auth.tokens[client.key]
    // }
  });
  return response?.data?.data;
}

type Client = any;