import z from 'zod';
import {
  TeamEnterpriseAuthStatusValues,
  TeamEnterpriseAuthTaskStatusValues,
  EnterpriseAuthErrValues
} from './constant';

/**
 * 企业认证状态的 zod schema。与 ./constant 拆开存放，
 * 保证常量文件（被客户端启动路径引用）不携带 zod 运行时。
 */
export const TeamEnterpriseAuthStatusSchema = z.enum(TeamEnterpriseAuthStatusValues);
export const TeamEnterpriseAuthTaskStatusSchema = z.enum(TeamEnterpriseAuthTaskStatusValues);
export const EnterpriseAuthErrSchema = z.enum(EnterpriseAuthErrValues);
