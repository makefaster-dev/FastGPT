import { type I18nNsType } from '@fastgpt/web/i18n/i18next';
import { getLangMapping, LANG_KEY } from '@fastgpt/web/i18n/utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type ServiceSidePropsOptions = {
  langCookieKey?: string;
  fallbackLangCookieKey?: string;
};

export const serviceSideProps = async (
  content: any,
  ns: I18nNsType = [],
  options: ServiceSidePropsOptions = {}
) => {
  const langCookieKey = options.langCookieKey || LANG_KEY;
  const lang = getLangMapping(
    content.req?.cookies?.[langCookieKey] ||
      (options.fallbackLangCookieKey
        ? content.req?.cookies?.[options.fallbackLangCookieKey]
        : undefined) ||
      content.locale ||
      ''
  );
  // SSR 只序列化当前语言的文案：额外预加载其他语言会让每个文档多携带上百 KB，
  // 语言切换时由客户端 i18n 动态 backend（partialBundledLanguages）按需加载。
  const namespaces = Array.from(new Set<I18nNsType[number]>(['common', 'price', ...ns]));

  return serverSideTranslations(lang, namespaces);
};
