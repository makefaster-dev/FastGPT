/**
 * 企业认证相关常量。保持零 zod 依赖：错误码表（common/error/code/team.ts）在客户端启动
 * 路径上引用本文件，若这里引入 zod 会把整个 zod 运行时带进每个页面的首屏 bundle。
 * 对应的 zod schema 定义在 ./schema.ts。
 */
export const EnterpriseAuthMaxTimes = 3;
export const EnterpriseAuthTrialDays = 15;
export const EnterpriseAuthTaskExpireHours = 24;
export const EnterpriseAuthAmountMaxErrorTimes = 3;

export const TeamEnterpriseAuthStatusValues = [
  'unverified',
  'verifying',
  'verified',
  'failed'
] as const;
export type TeamEnterpriseAuthStatusEnum = (typeof TeamEnterpriseAuthStatusValues)[number];
export const TeamEnterpriseAuthStatusEnum = Object.fromEntries(
  TeamEnterpriseAuthStatusValues.map((v) => [v, v])
) as { [K in TeamEnterpriseAuthStatusEnum]: K };

export const TeamEnterpriseAuthTaskStatusValues = [
  'starting',
  'info_failed',
  'pending_amount',
  'amount_failed',
  /**
   * 事务内临时态：仅用于金额验证成功后防止并发重复发放权益。
   * 不允许作为长期业务状态存在，也不参与 pending 任务恢复或统一社会信用代码锁。
   */
  'granting',
  'canceled',
  'expired',
  'failed',
  'verified',
  'service_failed'
] as const;
export type TeamEnterpriseAuthTaskStatusEnum = (typeof TeamEnterpriseAuthTaskStatusValues)[number];
export const TeamEnterpriseAuthTaskStatusEnum = Object.fromEntries(
  TeamEnterpriseAuthTaskStatusValues.map((v) => [v, v])
) as { [K in TeamEnterpriseAuthTaskStatusEnum]: K };

export const EnterpriseAuthPendingTaskStatuses = [
  TeamEnterpriseAuthTaskStatusEnum.starting,
  TeamEnterpriseAuthTaskStatusEnum.pending_amount,
  TeamEnterpriseAuthTaskStatusEnum.amount_failed
] as const;

export const EnterpriseAuthLockedTaskStatuses = [
  TeamEnterpriseAuthTaskStatusEnum.starting,
  TeamEnterpriseAuthTaskStatusEnum.pending_amount,
  TeamEnterpriseAuthTaskStatusEnum.amount_failed,
  TeamEnterpriseAuthTaskStatusEnum.verified
] as const;

export const EnterpriseAuthErrValues = [
  'enterpriseAuthDisabled',
  'enterpriseAuthServiceNotConfigured',
  'enterpriseAuthNoRemainingTimes',
  'enterpriseAuthAlreadyVerified',
  'enterpriseAuthEnterpriseOccupied',
  'enterpriseAuthTooFrequent',
  'enterpriseAuthServiceError',
  'enterpriseAuthServiceTimeout',
  'enterpriseAuthInfoFailed',
  'enterpriseAuthTaskNotFound',
  'enterpriseAuthTaskExpired',
  'enterpriseAuthAmountError',
  'enterpriseAuthAmountFailed',
  'enterpriseAuthProcessing'
] as const;
export type EnterpriseAuthErrEnum = (typeof EnterpriseAuthErrValues)[number];

export const EnterpriseAuthErrEnum = {
  disabled: 'enterpriseAuthDisabled',
  serviceNotConfigured: 'enterpriseAuthServiceNotConfigured',
  noRemainingTimes: 'enterpriseAuthNoRemainingTimes',
  alreadyVerified: 'enterpriseAuthAlreadyVerified',
  enterpriseOccupied: 'enterpriseAuthEnterpriseOccupied',
  tooFrequent: 'enterpriseAuthTooFrequent',
  serviceError: 'enterpriseAuthServiceError',
  serviceTimeout: 'enterpriseAuthServiceTimeout',
  infoFailed: 'enterpriseAuthInfoFailed',
  taskNotFound: 'enterpriseAuthTaskNotFound',
  taskExpired: 'enterpriseAuthTaskExpired',
  amountError: 'enterpriseAuthAmountError',
  amountFailed: 'enterpriseAuthAmountFailed',
  processing: 'enterpriseAuthProcessing'
} as const satisfies Record<string, EnterpriseAuthErrEnum>;
