import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { Box, Flex, IconButton, Button } from '@chakra-ui/react';
import { LOGO_ICON } from '@fastgpt/global/common/system/constants';
import { OAuthEnum } from '@fastgpt/global/support/user/constant';
import { createAuthorizationUrl } from '@fastgpt/global/support/user/account/verification/authorization';
import { useRouter } from 'next/router';
import { type Dispatch, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SsrFeConfigContext } from '@/pageComponents/login/SsrFeConfigContext';
import { useTranslation } from 'next-i18next';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import { checkIsWecomTerminal } from '@fastgpt/global/support/user/login/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { POST } from '@/web/common/api/request';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import type {
  WecomGetRedirectURLBodyType,
  WecomGetRedirectURLResponseType
} from '@fastgpt/global/openapi/support/user/account/login/api';

type Props = {
  children: React.ReactNode;
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
  pageType: `${LoginPageTypeEnum}`;
};

type OAuthItem = {
  label: string;
  provider: OAuthEnum | LoginPageTypeEnum;
  icon: any;
  pageType?: LoginPageTypeEnum;
  redirectUrl?: string;
};

const FormLayout = ({ children, setPageType, pageType }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const rootLogin = router.query.rootLogin === '1';

  const { setLoginStore, feConfigs } = useSystemStore();
  // SSR 首帧 feConfigs 尚未拉取，品牌标题回退到文档内联的配置
  const ssrFeConfigs = useContext(SsrFeConfigContext);
  const systemTitle = feConfigs?.systemTitle || ssrFeConfigs.systemTitle || '';

  const { lastRoute = '/dashboard/agent', lastTmbId = '' } = router.query as {
    lastRoute: string;
    lastTmbId?: string;
  };
  const computedLastRoute = useMemo(() => {
    return router.pathname === '/chat' ? router.asPath : lastRoute;
  }, [lastRoute, router.pathname, router.asPath]);

  const [oauthState] = useState(() => getNanoid(8));
  // SSR 阶段没有 location/navigator：给出空回退，OAuth 跳转链接只在浏览器点击时使用
  const isBrowser = typeof window !== 'undefined';
  const redirectUri = isBrowser ? `${location.origin}/login/provider` : '';

  const isWecomWorkTerminal = isBrowser ? checkIsWecomTerminal() : false;
  const canWecomTerminalAutoRedirect =
    !isWecomWorkTerminal || feConfigs?.wecomLoginAutoRedirect === true;

  const oAuthList: OAuthItem[] = useMemo(
    () => [
      ...(feConfigs?.sso?.url
        ? [
            {
              label: feConfigs.sso.title || 'Unknown',
              provider: OAuthEnum.sso,
              icon: feConfigs.sso.icon
            }
          ]
        : []),
      ...(feConfigs?.oauth?.wechat && pageType !== LoginPageTypeEnum.wechat
        ? [
            {
              label: t('common:support.user.login.Wechat'),
              provider: OAuthEnum.wechat,
              icon: 'common/wechatFill',
              pageType: LoginPageTypeEnum.wechat
            }
          ]
        : []),
      ...(pageType !== LoginPageTypeEnum.passwordLogin
        ? [
            {
              label: t('common:support.user.login.Password login'),
              provider: LoginPageTypeEnum.passwordLogin,
              icon: 'support/permission/privateLight',
              pageType: LoginPageTypeEnum.passwordLogin
            }
          ]
        : []),
      ...(feConfigs?.oauth?.google
        ? [
            {
              label: t('common:support.user.login.Google'),
              provider: OAuthEnum.google,
              icon: 'common/googleFill',
              redirectUrl: createAuthorizationUrl({
                provider: OAuthEnum.google,
                redirectUri,
                state: oauthState,
                interaction: 'login',
                config: feConfigs.oauth
              })
            }
          ]
        : []),
      ...(feConfigs?.oauth?.github
        ? [
            {
              label: t('common:support.user.login.Github'),
              provider: OAuthEnum.github,
              icon: 'common/gitFill',
              redirectUrl: createAuthorizationUrl({
                provider: OAuthEnum.github,
                redirectUri,
                state: oauthState,
                interaction: 'login',
                config: feConfigs.oauth
              })
            }
          ]
        : []),
      ...(feConfigs?.oauth?.microsoft
        ? [
            {
              label:
                feConfigs?.oauth?.microsoft?.customButton ||
                t('common:support.user.login.Microsoft'),
              provider: OAuthEnum.microsoft,
              icon: 'common/microsoft',
              redirectUrl: createAuthorizationUrl({
                provider: OAuthEnum.microsoft,
                redirectUri,
                state: oauthState,
                interaction: 'login',
                config: feConfigs.oauth
              })
            }
          ]
        : [])
    ],
    [feConfigs, oauthState, pageType, redirectUri, t]
  );

  const show_oauth = !!(feConfigs?.sso?.url || oAuthList.length > 0);

  const onClickOauth = useCallback(
    async (item: OAuthItem) => {
      if (item.pageType) {
        setPageType(item.pageType);
        return;
      }

      if (item.provider === OAuthEnum.sso) {
        const redirectUrl = await POST<string>('/proApi/support/user/account/login/getAuthURL', {
          redirectUri,
          isWecomWorkTerminal
        });
        setLoginStore({
          provider: item.provider as OAuthEnum,
          lastRoute: computedLastRoute,
          lastTmbId,
          state: oauthState
        });
        router.replace(redirectUrl, '_self');
        return;
      }

      if (item.provider === OAuthEnum.wecom) {
        const redirectUrl = await POST<WecomGetRedirectURLResponseType>(
          '/proApi/support/user/account/login/wecom/getRedirectUrl',
          {
            redirectUri,
            isWecomWorkTerminal,
            state: oauthState
          } satisfies WecomGetRedirectURLBodyType
        );
        setLoginStore({
          provider: item.provider as OAuthEnum,
          lastRoute: computedLastRoute,
          lastTmbId,
          state: oauthState
        });
        router.replace(redirectUrl, '_self');
        return;
      }

      if (item.redirectUrl) {
        setLoginStore({
          provider: item.provider as OAuthEnum,
          lastRoute: computedLastRoute,
          lastTmbId,
          state: oauthState
        });
        router.replace(item.redirectUrl, '_self');
      }
    },
    [
      computedLastRoute,
      isWecomWorkTerminal,
      lastTmbId,
      oauthState,
      redirectUri,
      router,
      setLoginStore,
      setPageType
    ]
  );

  // Auto login
  useEffect(() => {
    if (rootLogin) return;
    const sso = oAuthList.find((item) => item.provider === OAuthEnum.sso);
    // sso auto login
    if (sso && canWecomTerminalAutoRedirect && (feConfigs?.sso?.autoLogin || isWecomWorkTerminal)) {
      onClickOauth(sso);
    }
    if (feConfigs.oauth?.wecom && isWecomWorkTerminal && canWecomTerminalAutoRedirect) {
      onClickOauth({
        provider: OAuthEnum.wecom
      } as any);
    }
  }, [
    rootLogin,
    canWecomTerminalAutoRedirect,
    feConfigs?.sso?.autoLogin,
    isWecomWorkTerminal,
    onClickOauth,
    oAuthList,
    feConfigs.oauth?.wecom
  ]);

  return (
    <Flex
      flexDirection={'column'}
      h={'100%'}
      alignItems={['center', 'stretch']}
      justifyContent={['center', 'flex-start']}
    >
      <Flex
        alignItems={'center'}
        justifyContent={['flex-start', 'center']}
        w={['fit-content', '100%']}
        alignSelf={['flex-start', 'auto']}
      >
        <Flex alignItems={'center'} pr={['0', '4']} w={'fit-content'} justifyContent={'flex-start'}>
          <Flex
            w={['42px', '56px']}
            h={['42px', '56px']}
            bg={'white'}
            borderRadius={['semilg', 'lg']}
            borderWidth={['1px', '1.5px']}
            borderColor={'myGray.200'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <MyImage src={LOGO_ICON} w={['22.5px', '36px']} alt={'icon'} />
          </Flex>
          <Box ml={[3, 5]} fontSize={['lg', 'xl']} fontWeight={'bold'} color={'myGray.900'}>
            {systemTitle}
          </Box>
        </Flex>
      </Flex>
      <Box w={'100%'} mt={[8, 0]}>
        {children}
      </Box>
      {show_oauth && (
        <Box mt={8} w={'100%'}>
          <Box flex={1} />

          <Flex position={'relative'} mb={4} alignItems={'center'}>
            <Box h={'1px'} flex={'1'} bg={'myGray.250'} />
            <Box px={3} color={'myGray.500'} fontSize={'mini'}>
              or
            </Box>
            <Box h={'1px'} flex={'1'} bg={'myGray.250'} />
          </Flex>

          {oAuthList.length > 2 ? (
            <Flex gap={4} alignItems={'center'} justifyContent={'center'}>
              {oAuthList.map((item) => (
                <MyTooltip key={item.provider}>
                  <IconButton
                    size={'lgSquare'}
                    borderRadius={'50%'}
                    aria-label={item.label}
                    variant={'whitePrimary'}
                    icon={<Avatar src={item.icon as any} w={'20px'} />}
                    onClick={() => onClickOauth(item)}
                  />
                </MyTooltip>
              ))}
            </Flex>
          ) : (
            <Flex gap={4} alignItems={'center'} justifyContent={'center'}>
              {oAuthList.map((item) => (
                <Box key={item.provider} flex={1}>
                  <Button
                    variant={'whitePrimary'}
                    w={'100%'}
                    h={'40px'}
                    borderRadius={'sm'}
                    fontWeight={'medium'}
                    leftIcon={<Avatar src={item.icon as any} w={'20px'} />}
                    onClick={() => onClickOauth(item)}
                  >
                    {item.label}
                  </Button>
                </Box>
              ))}
            </Flex>
          )}
        </Box>
      )}
    </Flex>
  );
};

// 注意：登录表单是入口页的最大内容绘制来源，必须参与 SSR 首帧；
// 浏览器专用 API（location/navigator）已在组件内做了 SSR 安全回退，不要再用 ssr:false 包裹。
export default FormLayout;
