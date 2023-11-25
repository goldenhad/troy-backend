import type { AppProps } from 'next/app'
import './globals.css'
import Head from 'next/head';
import { Roboto } from 'next/font/google';
import { ConfigProvider, theme } from 'antd';

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
})

 
export default function MyApp({ Component, pageProps }: AppProps) {
  const { defaultAlgorithm, darkAlgorithm } = theme;

  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="logo_klein.ico" />
        <title>Wohnbau-WML | Geschäftsbericht</title>
      </Head>
      <main className={roboto.className}>
      <ConfigProvider
        theme={{
          algorithm: defaultAlgorithm,
        }}>
          <Component {...pageProps} />
      </ConfigProvider>
        
      </main>
    </>
  );
}