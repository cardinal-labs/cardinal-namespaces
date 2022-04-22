import type { Connection, PublicKey } from '@solana/web3.js'
import { HiUserCircle } from 'react-icons/hi'

import { AddressImage } from './AddressImage'
import { DisplayAddress } from './DisplayAddress'
import { shortPubKey } from '../utils/format'

export const ProfileSmall = ({
  connection,
  address,
  dark,
  onClick,
  placeholder,
}: {
  /** Solana RPC Connection to load this profile  */
  connection: Connection
  /** Address for which this profile is for */
  address: PublicKey | undefined
  /** Boolean for whether this should load dark or light loading bars */
  dark?: boolean
  /** onClick handler for clicking this profile */
  onClick?: () => void
  /** Placeholder for showing while the avatar is loading */
  placeholder?: React.ReactNode
}) => {
  return (
    <div className="flex cursor-pointer gap-2 text-sm" onClick={onClick}>
      <AddressImage
        connection={connection}
        address={address || undefined}
        height="40px"
        width="40px"
        dark={dark}
        placeholder={
          placeholder || (
            <div
              className="text-gray-300"
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                height: '40px',
                width: '40px',
              }}
            >
              <HiUserCircle className="relative left-[-5px] top-[-5px] h-[50px] w-[50px]" />
            </div>
          )
        }
      />
      <div>
        <div className={`text-${dark ? 'white' : 'black'}`}>
          <DisplayAddress
            style={{ pointerEvents: 'none' }}
            connection={connection}
            address={address || undefined}
            height="20px"
            width="100px"
            dark={dark}
          />
        </div>
        <div className="text-sm text-gray-500">{shortPubKey(address)}</div>
      </div>
    </div>
  )
}
