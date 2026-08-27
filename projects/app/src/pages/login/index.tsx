import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { clearToken } from '@/web/support/user/auth';
import { useMount } from 'ahooks';
import LoginModal from '@/pageComponents/login/LoginModal';
import { SsrFeConfigContext } from '@/pageComponents/login/SsrFeConfigContext';
import { postAcceptInvitationLink } from '@/web/support/user/team/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import { subRoute } from '@fastgpt/web/common/system/utils';
import { validateRedirectUrl } from '@/web/common/utils/uri';
import type { LoginSuccessResponseType } from '@fastgpt/global/openapi/support/user/account/login/api';
import { useLoginRedirectAfterLogin } from '@/web/support/user/loginRedirect';

const Login = ({
  ssrFeConfigs
}: {
  ssrFeConfigs?: { docUrl?: string | null; systemTitle?: string | null };
}) => {
  const router = useRouter();
  const { lastRoute = '', lastTmbId = '' } = router.query as {
    lastRoute: string;
    lastTmbId?: string;
  };
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setUserInfo } = useUserStore();
  const resolveLoginRedirect = useLoginRedirectAfterLogin();

  const loginSuccess = useCallback(
    async (res: LoginSuccessResponseType) => {
      const decodeLastRoute = validateRedirectUrl(lastRoute);

      const navigateTo = await (async () => {
        if (res.user.team.status !== 'active') {
          if (decodeLastRoute.includes('/account/team?invitelinkid=')) {
            const id = decodeLastRoute.split('invitelinkid=')[1];
            await postAcceptInvitationLink(id);
            return '/dashboard/agent';
          } else {
            toast({
              status: 'warning',
              title: t('common:not_active_team')
            });
          }
        }
        if (decodeLastRoute.startsWith(`${subRoute}/config`)) {
          return '/dashboard/agent';
        }

        return decodeLastRoute;
      })();

      const targetRoute = navigateTo
        ? await resolveLoginRedirect({
            user: res.user,
            fallbackRoute: navigateTo,
            lastTmbId
          })
        : undefined;

      setUserInfo(res.user);

      if (targetRoute) {
        router.replace(targetRoute);
      }
    },
    [lastRoute, lastTmbId, resolveLoginRedirect, router, setUserInfo, t, toast]
  );

  useMount(() => {
    clearToken();
    router.prefetch('/dashboard/agent');
  });

  return (
    <SsrFeConfigContext.Provider value={ssrFeConfigs ?? {}}>
      <LoginModal onSuccess={loginSuccess} />
    </SsrFeConfigContext.Provider>
  );
};

export async function getServerSideProps(context: any) {
  // 登录页是匿名入口，SSR 内容只依赖语言 Cookie；给浏览器一个短的私有缓存窗口，
  // 让重复访问跳过重新下载文档（默认 no-store 会强制每次全量拉取 HTML）。
  context.res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');

  return {
    props: {
      // 首帧需要的系统配置直接内联进文档：协议提示是最大内容绘制候选，
      // 不能等客户端 getInitData 返回后才出现。
      ssrFeConfigs: {
        docUrl: global.feConfigs?.docUrl ?? null,
        systemTitle: global.feConfigs?.systemTitle ?? null
      },
      ...(await serviceSideProps(context, ['app', 'user', 'login']))
    }
  };
}

export default Login;
