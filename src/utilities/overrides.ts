import * as fs from 'fs';
import * as path from 'path';
import { mergeWith } from 'lodash';

let defaults: Object | undefined = undefined;
async function getDefaults(): Promise<Object> {
  if (!defaults) {
    try {
      const response = await fetch('https://raw.githubusercontent.com/jacobSND/as-vscode/master/clientDefaults.json');

      if (!response.ok) {
        throw new Error(`Error fetching defaults: ${response.status}`);
      }

      defaults = await response.json();
    } catch (error) {
      console.error('Error downloading client defaults:', error);

      const localFilePath = path.join(__dirname, 'clientDefaults.json');
      defaults = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
    }
  }
  return structuredClone(defaults || {});
}

const merge = (destination: Object, ...sources: Object[]) => mergeWith(destination, ...sources, (objValue: any, srcValue: any) => {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
});

export async function getOverrides(settings: any, client: any) {
  const defaults = await getDefaults();
  const settingsObject = JSON.parse(JSON.stringify(settings));
  const merged = merge(settingsObject, defaults);

  const defaultOverrides = merged?.["*"];
  const dbOverrides = merged?.[client.db];
  const clientOverrides = merged?.[client.IMAGE_KEY || client.APP_NAME || client.WEBSITE_KEY];

  return merge(clientOverrides, dbOverrides, defaultOverrides);
}
