import {LogLevel} from './log_level';

/**
 * Describes a single log entry.
 * Contains information about the Correlation, ProcessModel and
 * FlowNodeInstance to which the entry belongs,
 * aswell as a timestamp, LogLvel and the concrete message that was logged.
 *
 * The properties here are ordered in the same manner as they are in the
 * actual log file.
 */
export class LogEntry {

  public timeStamp: Date;
  public correlationId: string;
  public processModelId: string;
  public processInstanceId: string;
  public flowNodeInstanceId?: string;
  public flowNodeId?: string;
  public logLevel: LogLevel;
  public message: string;

}
