/* eslint-disable @typescript-eslint/no-explicit-any */
import {HttpRequestWithIdentity} from '@essential-projects/http_contracts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {APIs, DataModels} from '@process-engine/process_engine_admin_api.contracts';

import {Response} from 'express';

export class KpiController {

  private httpCodeSuccessfulResponse: number = 200;

  private kpiApiService: APIs.IKpiApi;

  constructor(kpiApiService: APIs.IKpiApi) {
    this.kpiApiService = kpiApiService;
  }

  public async getRuntimeInformationForProcessModel(request: HttpRequestWithIdentity, response: Response): Promise<void> {
    const identity: IIdentity = request.identity;
    const processModelId: string = request.params.process_model_id;

    const result: Array<DataModels.Kpi.FlowNodeRuntimeInformation> =
      await this.kpiApiService.getRuntimeInformationForProcessModel(identity, processModelId);

    response.status(this.httpCodeSuccessfulResponse).json(result);
  }

  public async getRuntimeInformationForFlowNode(request: HttpRequestWithIdentity, response: Response): Promise<void> {
    const identity: IIdentity = request.identity;
    const processModelId: string = request.params.process_model_id;
    const flowNodeId: string = request.params.flow_node_id;

    const result: DataModels.Kpi.FlowNodeRuntimeInformation =
      await this.kpiApiService.getRuntimeInformationForFlowNode(identity, processModelId, flowNodeId);

    response.status(this.httpCodeSuccessfulResponse).json(result);
  }

  public async getActiveTokensForProcessModel(request: HttpRequestWithIdentity, response: Response): Promise<void> {
    const identity: IIdentity = request.identity;
    const processModelId: string = request.params.process_model_id;

    const result: Array<DataModels.Kpi.ActiveToken<any>> = await this.kpiApiService.getActiveTokensForProcessModel(identity, processModelId);

    response.status(this.httpCodeSuccessfulResponse).json(result);
  }

  public async getActiveTokensForProcessInstance(request: HttpRequestWithIdentity, response: Response): Promise<void> {
    const identity: IIdentity = request.identity;
    const processInstanceId: string = request.params.process_instance_id;

    const result: Array<DataModels.Kpi.ActiveToken<any>> = await this.kpiApiService.getActiveTokensForProcessInstance(identity, processInstanceId);

    response.status(this.httpCodeSuccessfulResponse).json(result);
  }

  public async getActiveTokensForCorrelationAndProcessModel(request: HttpRequestWithIdentity, response: Response): Promise<void> {
    const identity: IIdentity = request.identity;
    const correlationId: string = request.params.correlation_id;
    const processModelId: string = request.params.process_model_id;

    const result: Array<DataModels.Kpi.ActiveToken<any>> = await this
      .kpiApiService
      .getActiveTokensForCorrelationAndProcessModel(identity, correlationId, processModelId);

    response.status(this.httpCodeSuccessfulResponse).json(result);
  }

  public async getActiveTokensForFlowNode(request: HttpRequestWithIdentity, response: Response): Promise<void> {
    const identity: IIdentity = request.identity;
    const flowNodeId: string = request.params.flow_node_id;

    const result: Array<DataModels.Kpi.ActiveToken<any>> = await this.kpiApiService.getActiveTokensForFlowNode(identity, flowNodeId);

    response.status(this.httpCodeSuccessfulResponse).json(result);
  }

}
