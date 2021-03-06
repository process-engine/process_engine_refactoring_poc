import {IIdentity} from '@essential-projects/iam_contracts';

import {ProcessDefinitionFromRepository, ProcessModel} from '../types/process_model/index';

/**
 * The Service Layer of the ProcessModel API.
 * Uses the ProcessModelRepository to query and manipulate stored
 * ProcessDefinition.
 *
 * All retrieved ProcessDefinitions are returned in the internal Model-Format,
 * as it is defined in the contracts.
 */
export interface IProcessDefinitionService {

  /**
   * Writes a ProcessDefinition to the database.
   *
   * @async
   * @param identity          Contains the requesting users identity.
   * @param name              The name with which to persist the
   *                          ProcessDefinition.
   * @param xml               The ProcessDefinitions raw XML code.
   * @param overwriteExisting If true, any existing ProcessDefinition with
   *                          the same name will be overwritten.
   * @throws                  403, if the User is forbidden to persist
   *                          ProcessDefinitions.
   * @throws                  409, if a ProcessDefinition with the name already
   *                          exists and 'overwriteExisting' is
   *                          set to 'false'.
   */
  persistProcessDefinitions(identity: IIdentity, name: string, xml: string, overwriteExisting?: boolean): Promise<void>;

  /**
   * Retrieves a ProcessModel by its ID.
   * The user will only be able to see FlowNodes and Lanes that he is allowed
   * to access.
   *
   * @async
   * @param  identity       Contains the requesting users identity.
   * @param  processModelId The ID of the ProcessModel to retrieve.
   * @returns               The retrieved ProcessModel.
   * @throws                403, if the User is forbidden to see the
   *                        ProcessModel.
   * @throws                404, if the ProcessModel was not found.
   */
  getProcessModelById(identity: IIdentity, processModelId: string): Promise<ProcessModel.Process>;

  /**
   * Retrieves a ProcessDefinition in its raw XML format.
   *
   * @async
   * @param  identity Contains the requesting users identity.
   * @param  name     The name of the ProcessDefinition to get.
   * @returns         The retrieved ProcessDefinition.
   * @throws          403, if the User is forbidden to read ProcessDefinitions.
   * @throws          404, if the ProcessDefinition was not found.
   */
  getProcessDefinitionAsXmlByName(identity: IIdentity, name: string): Promise<ProcessDefinitionFromRepository>;

  /**
   * Retrieves a ProcessModel by its hash.
   *
   * @async
   * @param  identity        Contains the requesting users identity.
   * @param  processModelId: The ID of the ProcessModel to get.
   * @param  hash            The hash of the ProcessModel to get.
   *                         Used for getting specific versions of the ProcessModel.
   * @returns                The retrieved ProcessModel.
   * @throws                 404, if the ProcessModel was not found.
   */
  getByHash(identity: IIdentity, processModelId: string, hash: string): Promise<ProcessModel.Process>;

  /**
   * Gets a list of all stored ProcessModels.
   *
   * @async
   * @param identity Contains the requesting users identity.
   * @returns        The retrieved ProcessModels.
   * @throws         403, if the User is forbidden to read any ProcessModels.
   */
  getProcessModels(identity: IIdentity): Promise<Array<ProcessModel.Process>>;

  /**
   * Deletes the ProcessDefinition with a specific ProcessModelId.
   *
   * @async
   * @param  processModelId The ID of the processModel, by which correlations should be removed.
   *
   */
  deleteProcessDefinitionById(processModelId: string): Promise<void>;
}
