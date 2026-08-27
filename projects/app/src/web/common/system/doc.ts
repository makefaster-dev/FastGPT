import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { useSystemStore } from './useSystemStore';

/**
 * 拼接文档站链接。docUrl 默认取运行时 feConfigs；
 * SSR 首屏（store 尚未初始化）可通过 docUrlOverride 直接传入文档站地址。
 */
export const getDocPath = (path: string, docUrlOverride?: string) => {
  const docUrl = docUrlOverride || useSystemStore.getState().feConfigs?.docUrl;

  if (!docUrl) return '';
  if (!path.startsWith('/')) return path;
  if (docUrl.endsWith('/')) return docUrl.slice(0, -1);

  return getWebReqUrl(docUrl + path);
};
