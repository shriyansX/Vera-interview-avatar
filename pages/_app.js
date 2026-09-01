import '../styles/globals.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Vera — a spoken AI mock interview for engineering campus placements. Practice SDE, core technical, and HR rounds with instant scored feedback."
        />
        <title>Vera — AI Mock Interview for Campus Placements</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
