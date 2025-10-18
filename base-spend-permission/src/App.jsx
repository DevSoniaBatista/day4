import { useEffect, useState } from 'react'
import { createBaseAccountSDK } from '@base-org/account'
import { base, baseSepolia } from 'viem/chains'
import { parseEther } from 'viem'
import "./App.css"

const BACKEND_WALLET = import.meta.env.VITE_BACKEND_WALLET_ADDRESS
const TOKEN_ADDRESS = import.meta.env.VITE_REWARDS_CONTRACT_ADDRESS


const App = () => {
  const [sdk, setSdk] = useState(null)
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState(null)
  const [allowance, setAllowance] = useState(0.00009)

  useEffect(() => {
    const initSDK = () => {
      try{
        const baseSDK = createBaseAccountSDK({
          appName: 'Base Spend Permission',
          appChainIds: [baseSepolia.id],        
        })
        setSdk(baseSDK)
        setProvider(baseSDK.getProvider())
        console.log('Base Account SDK initialized', baseSDK)
      } catch(error){
        console.error('Error initializing Base Account SDK', error)
      }
  } 
  initSDK()  
  }, [])

  const handleConnect = async () => {
  if (!provider || !sdk) {
    alert('SDK not initialized. Please refresh the page.')
    return
  }

  setLoading(true)
  try {
    // Connect to Base Account using wallet connect
    await provider.request({ method: 'wallet_connect' })

    // Get the connected account
    const accounts = await provider.request({ method: 'eth_requestAccounts' })

    setAccount(accounts[0])
    setConnected(true)
    console.log('Connected account:', accounts[0])  
    setLoading(false)
  } catch (error) {
    console.error('Error connecting to Base Account:', error)
    setLoading(false)
  } finally {
    setLoading(false)
  }
}

const handleCreatePermission = async () => {
  if (!BACKEND_WALLET) {
    alert('Por favor, defina o endereço do spender (VITE_BACKEND_WALLET_ADDRESS).')
    return
  }
  if (!TOKEN_ADDRESS) {
    alert('Por favor, defina o endereço do token (VITE_REWARDS_CONTRACT_ADDRESS).')
    return
  }
  if (!allowance || Number(allowance) <= 0) {
    alert('Informe uma allowance válida.')
    return
  }

  setLoading(true)
  try {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    const salt = BigInt(
      '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
    ).toString()

    const permission = {
      account,
      spender: BACKEND_WALLET,
      token: TOKEN_ADDRESS,
      allowance: parseEther(String(allowance)).toString(),
      period: 2592000, // 30 dias em segundos
      start: Math.floor(Date.now() / 1000),
      end: 281474976710655, // Max uint48
      salt,
      extraData: '0x'
    }

    const domain = {
      name: 'Spend Permission Manager',
      version: '1',
      chainId: baseSepolia.id,
      verifyingContract: '0x1853210821cC5302F477BA5686d62019d9Cb967d'
    }

    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      SpendPermission: [
        { name: 'account', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'allowance', type: 'uint160' },
        { name: 'period', type: 'uint48' },
        { name: 'start', type: 'uint48' },
        { name: 'end', type: 'uint48' },
        { name: 'salt', type: 'uint256' },
        { name: 'extraData', type: 'bytes' },
      ]
    }

    const signature = await provider.request({
      method: 'eth_signTypedData_v4',
      params: [account, JSON.stringify({ domain, types, primaryType: 'SpendPermission', message: permission })]
    })

    const newPermission = { permission, signature }
    setPermission(newPermission)

    console.log('==============================')
    console.log('✅ SPEND PERMISSION CREATED!')
    console.log('==============================')
    console.log('\n👉 COPY THIS TO BACKEND SCRIPTS:\n')
    console.log('// Permission object:')
    console.log(JSON.stringify(newPermission.permission, null, 2))
    console.log('\n// Signature:')
    console.log(`${newPermission.signature}`)
    console.log('==============================')
  } catch (error) {
    console.error('Error creating permission:', error)
  } finally {
    setLoading(false)
  }
}


  return (
    <div>
      <h1 className="app-title">💰 Spend Permissions Demo</h1>
      <p className="app-subtitle">Create a spend permission for the backend wallet</p>

      {!connected ? (
        <button onClick={handleConnect} disabled={loading} className="app-button">
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="app-content">
          <div className="app-info">
            <p className="app-label">Your Address</p>
            <p className="app-value">{account.slice(0, 6)}...{account.slice(-4)}</p>
          </div>

          <div className="app-info">
            <p className="app-label">Backend Wallet (Spender)</p>
            <p className="app-value">{BACKEND_WALLET?.slice(0, 6)}...{BACKEND_WALLET?.slice(-4)}</p>
          </div>

          <div className="app-input-group">
            <label className="app-label">Allowance (ETH per 30 days)</label>
            <input
              type="number"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              disabled={loading || permission}
              className="app-input"
              step="0.001"
            />
            <button
              onClick={handleCreatePermission}
              disabled={loading || permission}
              className="app-button"
            >
              {permission ? 'Permission Created...' : loading ? 'Creating...' : 'Create Permission'}
            </button>

            {permission && (
              <div className="app-success">
                <p className="app-success-title">✅ Permission Created Successfully!</p>

                <div className="app-permission-details">
                  <div className="app-detail-row">
                    <span className="app-detail-label">User:</span>
                    <span className="app-detail-value">{permission.permission.account}</span>
                  </div>

                  <div className="app-detail-row">
                    <span className="app-detail-label">Spender:</span>
                    <span className="app-detail-value">{permission.permission.spender}</span>
                  </div>

                  <div className="app-detail-row">
                    <span className="app-detail-label">Allowance:</span>
                    <span className="app-detail-value">{allowance} ETH / 30 days</span>
                  </div>
                </div>

                <div className="app-instructions">
                  <p className="app-instructions-title">🪜 Next Steps:</p>
                  <ol className="app-instructions-list">
                    <li>Open browser console (F12)</li>
                    <li>Copy permission object and signature</li>
                    <li>Paste into <code>backend/approvePermission.js</code></li>
                    <li>Run: <code>npm run approve</code></li>
                    <li>Then run: <code>npm run spend</code></li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
