import { mergeWith } from 'lodash';
import * as defaults from '../../clientDefaults.json';

export function getOverrides(settings: any, client: any) {
  const merged = mergeWith(JSON.parse(JSON.stringify(settings)), defaults);

  const defaultOverrides = merged?.["*"];
  const dbOverrides = merged?.[client.db];
  const clientOverrides = merged?.[client.IMAGE_KEY || client.APP_NAME || client.WEBSITE_KEY];

  return mergeWith(clientOverrides, dbOverrides, defaultOverrides, (objValue, srcValue) => {
    if (!Array.isArray(objValue)) return undefined;
    return [...objValue, ...srcValue];
  });
}
