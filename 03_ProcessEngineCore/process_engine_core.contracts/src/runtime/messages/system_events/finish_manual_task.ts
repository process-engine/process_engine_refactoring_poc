import {IIdentity} from '@essential-projects/iam_contracts';

import {BaseSystemEventMessage} from './base_system_event_message';

/**
 * The message used to finish a waiting ManualTask.
 */
export class FinishManualTaskMessage extends BaseSystemEventMessage {

  /**
   * The flow node id of the ManualTask being finished.
   */
  public manualTaskId: string;

  constructor(correlationId: string,
              processModelId: string,
              processInstanceId: string,
              flowNodeId: string,
              flowNodeInstanceId: string,
              processInstanceOwner: IIdentity,
              currentToken: any) {
    super(correlationId, processModelId, processInstanceId, flowNodeId, flowNodeInstanceId, processInstanceOwner, currentToken);
  }
}
