import { createContext, useContext, useState } from 'react'

const TierContext = createContext(null)

export function TierProvider({ children }) {
  const [tier, setTierState] = useState(
    () => sessionStorage.getItem('cm_tier') || 'disciple'
  )

  function setTier(t) {
    setTierState(t)
    sessionStorage.setItem('cm_tier', t)
  }

  return (
    <TierContext.Provider value={{ tier, setTier }}>
      {children}
    </TierContext.Provider>
  )
}

export function useTier() {
  return useContext(TierContext)
}
