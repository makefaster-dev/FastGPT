import z from 'zod';
import { LocaleList } from './constants';

// 语言常量已迁移到 ./constants（避免启动路径引入 zod）；这里保留 re-export 兼容旧导入。
export { LangEnum, LocaleList, langMap, type localeType } from './constants';

export const I18nStringSchema = z.object({
  en: z.string(),
  'zh-CN': z.string(),
  'zh-Hant': z.string().optional(),
  'ko-KR': z.string().optional()
});
export type I18nStringType = z.infer<typeof I18nStringSchema>;

export const LanguageSchema = z.enum(LocaleList).meta({ description: '用户语言偏好' });

export const I18nUnionStringSchema = z.union([I18nStringSchema, z.string()]);
export type I18nUnionStringType = z.infer<typeof I18nUnionStringSchema>;
