import React from 'react'
import { useContext } from 'react'
import { NextSeo } from 'next-seo'

import { NameCtx } from '../../contexts/Name'

function Title() {
  const { name } = useContext(NameCtx)

  if (!name) return <NextSeo title="Momentum Clonish" />
  return <NextSeo title={`${name}'s Momentum`} />
}

export default Title
