Criar Frontend
npm create vite@latest base-spend-permission -- --template react

 Use rolldown-vite (Experimental)?:
│  No
│
◇  Install with npm and start now?
│  No

----
cd  base-spend-permission
npm i
 
 npm install @base-org/account viem

 ---
 In no CDP
 e buscar em 
 Payment Master em :
 OnChainTools/Base Paymaster
 https://portal.cdp.coinbase.com/products/paymaster/configuration?projectId=009ee197-0bc1-4922-8381-8ca387ff3873

 COPIAR url DE PAYMENT MASTER EM VITE_PAYMASTER_SERVICE_URL

Habilitar Contract allowList e inserir o nome do contrato(RewardContract), address e funcao (claimReward()) do contrato que foi criado
 ----