import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getWalletAdapters } from '@solana/wallet-adapter-wallets'
import { Connection, PublicKey } from '@solana/web3.js'
import type { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'

import { ConnectTwitterButton } from '../src/components/ConnectTwitterButton'
import { WalletIdentityProvider } from '../src/providers/WalletIdentityProvider'
import { tryPublicKey } from '../src/utils/format'

export default {
  title: 'Components/ConnectTwitterButton',
  component: ConnectTwitterButton,
  argTypes: {
    connection: {
      options: ['mainnet', 'devnet', 'testnet'],
      description: 'Solana RPC connection to fetch the mapping from',
      mapping: {
        mainnet: new Connection('https://api.mainnet-beta.solana.com'),
        devnet: new Connection('https://api.devnet.solana.com'),
        testnet: new Connection('https://api.testnet.solana.com'),
      },
      address: {
        control: 'text',
      },
    },
  },
} as ComponentMeta<typeof ConnectTwitterButton>

const Template: ComponentStory<typeof ConnectTwitterButton> = ({ ...args }) => {
  const publicKey = tryPublicKey(args.address)
  require('@solana/wallet-adapter-react-ui/styles.css')
  if (publicKey) {
    return (
      <WalletProvider wallets={getWalletAdapters()}>
        <WalletModalProvider>
          <WalletIdentityProvider>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <ConnectTwitterButton
                address={publicKey}
                variant={args.variant}
                dev={args.dev}
                cluster={args.cluster}
                connection={
                  args.connection ||
                  new Connection('https://api.mainnet-beta.solana.com')
                }
                wallet={args.wallet}
                style={args.style}
                disabled={args.disabled}
              />
            </div>
          </WalletIdentityProvider>
        </WalletModalProvider>
      </WalletProvider>
    )
  }
  return <div>Invalid Public Key</div>
}

export const Primary = Template.bind({})
Primary.args = {
  address: new PublicKey('DNVVBNkdyv6tMentHdjVz5cpYmjQYcquLfYkz1fApT7Q'),
  connection: new Connection('https://api.mainnet-beta.solana.com'),
}
