/**
 * i18n 基础常量（语言枚举、语言列表、语言展示映射）。
 * 独立于 zod schema 存放：这些常量被客户端启动路径（i18n 初始化、语言切换）引用，
 * 如果和 schema 同文件会把整个 zod 运行时带进每个页面的首屏 bundle。
 */
export enum LangEnum {
  'zh_CN' = 'zh-CN',
  'zh_Hant' = 'zh-Hant',
  'en' = 'en',
  'ko_KR' = 'ko-KR'
}

export type localeType = `${LangEnum}`;
export const LocaleList = ['en', 'zh-CN', 'zh-Hant', 'ko-KR'] as const;

export const langMap = {
  [LangEnum.en]: {
    label: 'English(US)',
    avatar: 'common/language/America'
  },
  [LangEnum.zh_CN]: {
    label: '简体中文',
    avatar: 'common/language/China'
  },
  [LangEnum.zh_Hant]: {
    label: '繁体中文',
    avatar: 'common/language/China'
  },
  [LangEnum.ko_KR]: {
    label: '한국어 (대한민국)',
    avatar: 'common/language/SouthKorea'
  }
};
