# Auctioneer Software
A vscode extension for searching and other common tasks related to the Auctioneer Software project.

## Requirements
- Be a member of the Auctioneer Software organization on Github
- Authenticate with your Github account in the extension settings
- Configure the extension to use the correct path to your local Auctioneer Software project and clients

## Features
- Search Auctioneer Software clients on Github
- Get details about a client
  - Name and Key
  - Cluster & Type
  - URL
  - Actions (open locally, open in browser, open on Github)
  - Links (Graphs, Logs, etc)
- Commands to perform common actions (core update, start, etc)
- Customizable settings for path overrides and more

## Getting Started
1. [Install the extension](https://marketplace.visualstudio.com/items?itemName=JacobSND.auctionsoft)
2. Open the extension settings
3. Authenticate with your Github account
4. Configure the extension to use the correct path to your local Auctioneer Software project and clients
5. Add overrides (optional)
6. Open the Auctioneer Software panel
7. Search for a client

## Custom Overrides
If you would like to override the default path to your Auctioneer Software project or clients, you can do so in the extension settings. This is useful if you have a non-standard setup or if you have multiple projects. You can also include links, override the cluster tag, and more.

The override setting is an array of objects with the key being the client key, the database IP, or '*' to apply to all clients.
ex: 
```json
"as2.clients.overrides": {
  "aaa": {
    "localPath": "~/Projects/as2/clients/aaa"
  },
  "10.5.100.102": {
    "links": [{
      "url": "https://github.com/",
      "text": "Custom Link"
    }]
  }
}
`````` 

## Contributing/Suggestions
If you have any suggestions or would like to contribute, please open an issue or pull request on [Github](https://github.com/jacobSND/as-vscode/)