import {Model} from '@process-engine/process_model.contracts';

/**
 * Used to cache ProcessModels during conversion of suspended FlowNodeInstances.
 * This helps to avoid repeated queries against the database for the same ProcessModel.
 */
interface IProcessModelCache {[cacheEntryKey: string]: Model.Process}

const processModelCache: IProcessModelCache = {};

export function hasEntry(cacheEntryKey: string): boolean {
  return processModelCache[cacheEntryKey] !== undefined;
}

export function add(cacheEntryKey: string, processModel: Model.Process): void {
  processModelCache[cacheEntryKey] = processModel;
}

export function get(cacheEntryKey: string): Model.Process {
  return processModelCache[cacheEntryKey];
}
