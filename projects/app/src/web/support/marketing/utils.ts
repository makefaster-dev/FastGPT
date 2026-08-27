import type { ShortUrlParams, TrackRegisterParams } from '@fastgpt/global/support/marketing/type';

const fastgptSemSourceDomainInitedKey = 'fastgpt_sem_sourceDomain_inited';

type FastGPTSemLocalType = NonNullable<TrackRegisterParams['fastgpt_sem']>;

const FASTGPT_SEM_STRING_KEYS = [
  'shortUrlSource',
  'shortUrlMedium',
  'shortUrlContent',
  'keyword',
  'search',
  'sourceDomain',
  'visitor_id'
] as const;

/**
 * 本地 fastgpt_sem 数据的轻量校验（等价于 FastGPT_SEM_Schema 的客户端子集）。
 * 刻意不用 zod：本文件在每个页面的启动路径上，引入 zod 会把整个运行时带进首屏 bundle；
 * 服务端上报仍由 zod schema 严格校验。校验失败返回 undefined，与 safeParse 失败分支一致。
 */
const sanitizeFastGPTSem = (value: unknown): FastGPTSemLocalType | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

  const input = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of FASTGPT_SEM_STRING_KEYS) {
    const item = input[key];
    if (item === undefined) continue;
    if (typeof item !== 'string') return undefined;
    if (key === 'visitor_id') {
      const trimmed = item.trim();
      if (trimmed.length < 1 || trimmed.length > 64) return undefined;
      result[key] = trimmed;
    } else {
      result[key] = item;
    }
  }
  return result;
};

export const getBdVId = () => {
  return sessionStorage.getItem('bd_vid') || undefined;
};
export const setBdVId = (bdVid?: string) => {
  if (!bdVid) return;
  sessionStorage.setItem('bd_vid', bdVid);
};

export const getMsclkid = () => {
  return sessionStorage.getItem('msclkid') || undefined;
};
export const setMsclkid = (msclkid?: string) => {
  if (!msclkid) return;
  sessionStorage.setItem('msclkid', msclkid);
};

export const getUtmWorkflow = () => {
  return localStorage.getItem('utm_workflow') || undefined;
};
export const setUtmWorkflow = (utmWorkflow?: string) => {
  if (!utmWorkflow) return;
  localStorage.setItem('utm_workflow', utmWorkflow);
};
export const removeUtmWorkflow = () => {
  localStorage.removeItem('utm_workflow');
};

export const getUtmParams = () => {
  try {
    const params = JSON.parse(localStorage.getItem('utm_params') || '{}');
    return params as ShortUrlParams;
  } catch (error) {
    return {} as ShortUrlParams;
  }
};
export const setUtmParams = (utmParams?: ShortUrlParams) => {
  if (!utmParams || Object.keys(utmParams).length === 0) return;
  localStorage.setItem('utm_params', JSON.stringify(utmParams));
};
export const removeUtmParams = () => {
  localStorage.removeItem('utm_params');
};

export const getFastGPTSem = (): TrackRegisterParams['fastgpt_sem'] => {
  try {
    const value = localStorage.getItem('fastgpt_sem');
    if (!value) return undefined;

    const result = sanitizeFastGPTSem(JSON.parse(value));
    if (result) return result;

    localStorage.removeItem('fastgpt_sem');
    return undefined;
  } catch {
    localStorage.removeItem('fastgpt_sem');
    return undefined;
  }
};

export const onFastGPTLoginSuccess = async <T>(
  loginSuccess: (result: T) => void | Promise<void>,
  result: T
) => {
  await loginSuccess(result);
  removeFastGPTSem();
};

export const setFastGPTSem = (fastgptSem?: TrackRegisterParams['fastgpt_sem']) => {
  if (!fastgptSem) return;

  const validEntries = Object.entries(fastgptSem).filter(([_, value]) => !!value);
  if (validEntries.length === 0) return;

  const currentFastGPTSem = getFastGPTSem();
  const nextFastGPTSem = Object.fromEntries(validEntries);
  const result = sanitizeFastGPTSem({
    ...currentFastGPTSem,
    ...nextFastGPTSem
  });

  if (!result) return;
  localStorage.setItem('fastgpt_sem', JSON.stringify(result));
};
export const removeFastGPTSem = () => {
  localStorage.removeItem('fastgpt_sem');
  localStorage.removeItem(fastgptSemSourceDomainInitedKey);
};

export const initFastGPTSemSourceDomain = (sourceDomain?: string) => {
  if (localStorage.getItem(fastgptSemSourceDomainInitedKey)) return;

  const formatSourceDomain = (() => {
    if (sourceDomain) return sourceDomain;
    return document.referrer;
  })();

  localStorage.setItem(fastgptSemSourceDomainInitedKey, '1');

  if (!formatSourceDomain) return;
  setFastGPTSem({ sourceDomain: formatSourceDomain });
};

export const setCouponCode = (couponCode?: string) => {
  if (!couponCode) return;
  const normalizedCouponCode = couponCode.trim();
  if (!normalizedCouponCode) return;
  localStorage.setItem('couponCode', normalizedCouponCode);
};

export const getCouponCode = () => {
  return localStorage.getItem('couponCode') || undefined;
};

export const removeCouponCode = () => {
  localStorage.removeItem('couponCode');
};
