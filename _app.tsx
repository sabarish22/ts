import type { AppProps } from 'next/app';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchHeadlessClient } from '@stytch/nextjs/headless';
import { Toaster } from 'react-hot-toast';
import { IntlProvider } from 'react-intl';
import Head from 'next/head';
import posthog from 'posthog-js';
import { ErrorBoundary } from '@sentry/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { init } from "commandbar";

import '../styles/globals.css';
import UserProvider from 'context/user';
import Layout from 'components/container-components/layout/Layout';
import CompanyProvider from 'context/company';
import LoginRoutingHandler from 'components/container-components/LoginRoutingHandler';
import MobileDeviceRestriction from 'components/container-components/mobileDeviceRestriction';
import FallbackUI from 'components/container-components/FallbackUI';
import { canRunPosthog } from 'utils/window';
import { RefreshSession } from 'components/container-components/RefreshSession';
import MaintenanceMode from 'components/container-components/maintenance-mode';

const posthog_key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthog_host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const stytch_public_token = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;

if (typeof window !== "undefined") {
  init("55509297");
}

if (canRunPosthog() && posthog_key && posthog_host) {
  posthog.init(posthog_key, { api_host: posthog_host });
}

const stytch = createStytchHeadlessClient(stytch_public_token);

export default function App({ Component, pageProps }: AppProps) {
  const [locale, setLocale] = useState('en');
  const router = useRouter();
  const { push } = useRouter();
  const [commandBarReady, setCommandBarReady] = useState(false);

  useEffect(() => {
    window.CommandBar.boot("me").then(() => {
      setCommandBarReady(true);
    });

    return window.CommandBar.shutdown;
  }, []);

  /* useEffect(() => {
    if (commandBarReady) {
      window.CommandBar.addCommand({
        name: "home",
        text: "Go to Home",
        category: "Navigation",
        icon: "https://openmoji.org/data/color/svg/E269.svg",
        template: { type: "link", value: "/", operation: "router" },
        availability_rules: [
          {
            type: "url",
            operator: "isNot",
            value: "/",
          },
        ],
      });
      return () => {
        window.CommandBar.removeCommand("home");
        window.CommandBar.removeCommand("foo");
      };
    }
  }, [commandBarReady]); */

  useEffect(() => {
    if (commandBarReady) {
      window.CommandBar.addRouter(push);
    }
  }, [push, commandBarReady]);

  useEffect(() => {
    if (!window) return;
    const locale = window.navigator.language;
    setLocale(locale);
  }, []);

  useEffect(() => {
    // subscribe to routeChangeComplete event
    if (typeof window === 'undefined') return;
    if (!(window as any).Intercom) return;
    const refreshIntercom = (_url) => {
      (window as any).Intercom('update');
    };
    router.events.on('routeChangeComplete', refreshIntercom);

    // unsubscribe on component destroy in useEffect return function
    return () => {
      // router.events.off('routeChangeStart', incrementStartCount);
      router.events.off('routeChangeComplete', refreshIntercom);
    };
  }, [router.events]);

  return (
    <ErrorBoundary fallback={<FallbackUI />}>
      <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
      <Head>
        <title>Thera | Payroll For Remote teams</title>
      </Head>
      <IntlProvider locale={locale} defaultLocale="en">
        <StytchProvider stytch={stytch}>
          <UserProvider>
            <CompanyProvider>
              <LoginRoutingHandler>
                <MaintenanceMode>
                  <MobileDeviceRestriction>
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  </MobileDeviceRestriction>
                </MaintenanceMode>
              </LoginRoutingHandler>
            </CompanyProvider>
          </UserProvider>
          <RefreshSession />
        </StytchProvider>
      </IntlProvider>
    </ErrorBoundary>
  );
}
