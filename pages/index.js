import Head from 'next/head'
import styles from '../styles/Home.module.css'
import App from './App'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Momentum Clonish</title>
        <meta
          name="description"
          content="A privacy-first Momentum-style dashboard built with Next.js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <App />

    </div>
  )
}
