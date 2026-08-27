import { createContext } from 'react';

/**
 * 登录页 SSR 内联的少量系统配置。
 * feConfigs 正常要等客户端 getInitData 返回后才可用，导致依赖它的首屏元素
 * （协议提示等最大内容绘制候选）在水合 + 接口返回后才出现；把首帧需要的字段
 * 在 getServerSideProps 里内联进文档，让这些元素直接随服务端 HTML 绘制。
 */
export const SsrFeConfigContext = createContext<{
  docUrl?: string | null;
  systemTitle?: string | null;
}>({});
