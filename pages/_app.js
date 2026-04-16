import '../styles/globals.css'
import Name from '../src/contexts/Name'

function MyApp({ Component, pageProps }) {
  return (
    <Name>
      <Component {...pageProps} />
    </Name>
  )
}

export default MyApp
