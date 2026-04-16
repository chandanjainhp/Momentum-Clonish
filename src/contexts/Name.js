import React, { createContext, useEffect, useMemo, useState } from 'react'

const NAME_KEY = 'momentum-clonish-name'

export const NameCtx = createContext({
  name: '',
  saveName: () => {},
})

function Name({ children }) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem(NAME_KEY)
    if (stored) {
      setName(stored)
    }
  }, [])

  const saveName = (newName) => {
    const normalizedName = newName.trim()
    setName(normalizedName)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NAME_KEY, normalizedName)
    }
  }

  const value = useMemo(
    () => ({
      name,
      saveName,
    }),
    [name]
  )

  return <NameCtx.Provider value={value}>{children}</NameCtx.Provider>
}

export default Name

