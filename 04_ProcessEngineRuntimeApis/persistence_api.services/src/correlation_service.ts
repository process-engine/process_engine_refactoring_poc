import {IIAMService, IIdentity} from '@essential-projects/iam_contracts';

import {NotFoundError} from '@essential-projects/errors_ts';

import {
  Correlation,
  CorrelationFromRepository,
  CorrelationProcessInstance,
  CorrelationState,
  ICorrelationRepository,
  ICorrelationService,
} from '@process-engine/correlation.contracts';

import {IProcessDefinitionRepository} from '@process-engine/process_model.contracts';

/**
 * Groups ProcessModelHashes by their associated CorrelationId.
 *
 * Only use internally.
 */
type GroupedCorrelations = {
  [correlationId: string]: Array<CorrelationFromRepository>;
};

const canReadProcessModelClaim = 'can_read_process_model';
const canDeleteProcessModel = 'can_delete_process_model';

export class CorrelationService implements ICorrelationService {

  private readonly correlationRepository: ICorrelationRepository;
  private readonly iamService: IIAMService;
  private readonly processDefinitionRepository: IProcessDefinitionRepository;

  constructor(
    correlationRepository: ICorrelationRepository,
    iamService: IIAMService,
    processDefinitionRepository: IProcessDefinitionRepository,
  ) {

    this.correlationRepository = correlationRepository;
    this.iamService = iamService;
    this.processDefinitionRepository = processDefinitionRepository;
  }

  public async createEntry(
    identity: IIdentity,
    correlationId: string,
    processInstanceId: string,
    processModelId: string,
    processModelHash: string,
    parentProcessInstanceId?: string,
  ): Promise<void> {
    return this
      .correlationRepository
      .createEntry(identity, correlationId, processInstanceId, processModelId, processModelHash, parentProcessInstanceId);
  }

  public async getActive(identity: IIdentity): Promise<Array<Correlation>> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);

    const activeCorrelationsFromRepo = await this.correlationRepository.getCorrelationsByState(CorrelationState.running);

    const filteredCorrelationsFromRepo = this.filterCorrelationsFromRepoByIdentity(identity, activeCorrelationsFromRepo);

    const activeCorrelationsForIdentity = await this.mapCorrelationList(filteredCorrelationsFromRepo);

    return activeCorrelationsForIdentity;
  }

  public async getAll(identity: IIdentity): Promise<Array<Correlation>> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);

    const correlationsFromRepo = await this.correlationRepository.getAll();

    const filteredCorrelationsFromRepo = this.filterCorrelationsFromRepoByIdentity(identity, correlationsFromRepo);

    const correlations = await this.mapCorrelationList(filteredCorrelationsFromRepo);

    return correlations;
  }

  public async getByProcessModelId(identity: IIdentity, processModelId: string): Promise<Array<Correlation>> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);

    const correlationsFromRepo = await this.correlationRepository.getByProcessModelId(processModelId);

    const filteredCorrelationsFromRepo = this.filterCorrelationsFromRepoByIdentity(identity, correlationsFromRepo);

    const correlations = await this.mapCorrelationList(filteredCorrelationsFromRepo);

    return correlations;
  }

  public async getByCorrelationId(identity: IIdentity, correlationId: string): Promise<Correlation> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);

    // NOTE:
    // These will already be ordered by their createdAt value, with the oldest one at the top.
    const correlationsFromRepo = await this.correlationRepository.getByCorrelationId(correlationId);

    const filteredCorrelationsFromRepo = this.filterCorrelationsFromRepoByIdentity(identity, correlationsFromRepo);

    // All correlations will have the same ID here, so we can just use the top entry as a base.
    const noFilteredCorrelationsFromRepo = filteredCorrelationsFromRepo.length === 0;
    if (noFilteredCorrelationsFromRepo) {
      throw new NotFoundError('No such correlations for the user.');
    }

    const correlation = await this.mapCorrelation(correlationsFromRepo[0].id, correlationsFromRepo);

    return correlation;
  }

  public async getByProcessInstanceId(identity: IIdentity, processInstanceId: string): Promise<Correlation> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);

    const correlationFromRepo = await this.correlationRepository.getByProcessInstanceId(processInstanceId);

    const correlation = await this.mapCorrelation(correlationFromRepo.id, [correlationFromRepo]);

    return correlation;
  }

  public async getSubprocessesForProcessInstance(identity: IIdentity, processInstanceId: string): Promise<Correlation> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);

    const correlationsFromRepo = await this.correlationRepository.getSubprocessesForProcessInstance(processInstanceId);

    const filteredCorrelationsFromRepo = this.filterCorrelationsFromRepoByIdentity(identity, correlationsFromRepo);

    const noFilteredCorrelations = filteredCorrelationsFromRepo.length === 0;
    if (noFilteredCorrelations) {
      return undefined;
    }

    const correlation = await this.mapCorrelation(correlationsFromRepo[0].id, correlationsFromRepo);

    return correlation;
  }

  public async deleteCorrelationByProcessModelId(identity: IIdentity, processModelId: string): Promise<void> {
    await this.iamService.ensureHasClaim(identity, canDeleteProcessModel);
    await this.correlationRepository.deleteCorrelationByProcessModelId(processModelId);
  }

  public async finishProcessInstanceInCorrelation(identity: IIdentity, correlationId: string, processInstanceId: string): Promise<void> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);
    await this.correlationRepository.finishProcessInstanceInCorrelation(correlationId, processInstanceId);
  }

  public async finishProcessInstanceInCorrelationWithError(
    identity: IIdentity,
    correlationId: string,
    processInstanceId: string,
    error: Error,
  ): Promise<void> {
    await this.iamService.ensureHasClaim(identity, canReadProcessModelClaim);
    await this.correlationRepository.finishProcessInstanceInCorrelationWithError(correlationId, processInstanceId, error);
  }

  private filterCorrelationsFromRepoByIdentity(
    identity: IIdentity,
    correlationsFromRepo: Array<CorrelationFromRepository>,
  ): Array<CorrelationFromRepository> {

    return correlationsFromRepo.filter((correlationFromRepo: CorrelationFromRepository): boolean => {
      // Correlations that were created with the dummy token are visible to everybody.
      const isDummyToken = correlationFromRepo.identity.userId === 'dummy_token';
      const userIdsMatch = identity.userId === correlationFromRepo.identity.userId;

      return isDummyToken || userIdsMatch;
    });
  }

  /**
   * Maps a given List of CorrelationFromRepository objects into a List of
   * Runtime Correlation objects.
   *
   * @async
   * @param   correlationsFromRepo The Correlations to map.
   * @returns                      The mapped Correlation.
   */
  private async mapCorrelationList(correlationsFromRepo: Array<CorrelationFromRepository>): Promise<Array<Correlation>> {
    const groupedCorrelations = this.groupCorrelations(correlationsFromRepo);

    const uniqueCorrelationIds = Object.keys(groupedCorrelations);

    const mappedCorrelations: Array<Correlation> = [];

    for (const correlationId of uniqueCorrelationIds) {
      const matchingCorrelationEntries = groupedCorrelations[correlationId];

      const mappedCorrelation = await this.mapCorrelation(correlationId, matchingCorrelationEntries);
      mappedCorrelations.push(mappedCorrelation);
    }

    return mappedCorrelations;
  }

  /**
   * Takes a list of CorrelationFromRepository objects and groups them by their
   * CorrelationId.
   *
   * @param   correlations The Correlations to group.
   * @returns              The grouped Correlations.
   */
  private groupCorrelations(correlations: Array<CorrelationFromRepository>): GroupedCorrelations {

    const groupedCorrelations: GroupedCorrelations = {};

    for (const correlation of correlations) {

      const groupHasNoMatchingEntry = !groupedCorrelations[correlation.id];

      if (groupHasNoMatchingEntry) {
        groupedCorrelations[correlation.id] = [];
      }

      groupedCorrelations[correlation.id].push(correlation);
    }

    return groupedCorrelations;
  }

  /**
   * Maps a given list of CorrelationFromRepository objects into a,
   * Correlation object, using the given CorrelationId as a base.
   *
   * @async
   * @param   correlationId           The ID of the Correlation to map.
   * @param   correlationEntriess     The list of entries to map.
   * @returns                         The mapped Correlation.
   */
  private async mapCorrelation(
    correlationId: string,
    correlationsFromRepo?: Array<CorrelationFromRepository>,
  ): Promise<Correlation> {

    const parsedCorrelation = new Correlation();
    parsedCorrelation.id = correlationId;
    parsedCorrelation.createdAt = correlationsFromRepo[0].createdAt;

    if (correlationsFromRepo) {
      parsedCorrelation.processInstances = [];

      for (const correlationFromRepo of correlationsFromRepo) {

        /**
         * As long as there is at least one running ProcessInstance within a correlation,
         * the correlation will always have a running state, no matter how many
         * "finished" instances there might be.
         */
        parsedCorrelation.state = parsedCorrelation.state !== CorrelationState.running
          ? correlationFromRepo.state
          : CorrelationState.running;

        const correlationEntryHasErrorAttached = !correlationFromRepo.error;

        if (correlationEntryHasErrorAttached) {
          parsedCorrelation.state = CorrelationState.error;
          parsedCorrelation.error = correlationFromRepo.error;
        }

        const processDefinition = await this.processDefinitionRepository.getByHash(correlationFromRepo.processModelHash);

        const processModel = new CorrelationProcessInstance();
        processModel.processDefinitionName = processDefinition.name;
        processModel.xml = processDefinition.xml;
        processModel.hash = correlationFromRepo.processModelHash;
        processModel.processModelId = correlationFromRepo.processModelId;
        processModel.processInstanceId = correlationFromRepo.processInstanceId;
        processModel.parentProcessInstanceId = correlationFromRepo.parentProcessInstanceId;
        processModel.createdAt = correlationFromRepo.createdAt;
        processModel.state = correlationFromRepo.state;
        processModel.identity = correlationFromRepo.identity;

        if (correlationEntryHasErrorAttached) {
          processModel.error = correlationFromRepo.error;
        }

        parsedCorrelation.processInstances.push(processModel);
      }
    }

    return parsedCorrelation;
  }

}