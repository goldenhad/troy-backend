import type { AppProps } from 'next/app'
import './globals.css'
import 'bootstrap/dist/css/bootstrap.css'
import Head from 'next/head';
 
export default function MyApp({ Component, pageProps }: AppProps) {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}