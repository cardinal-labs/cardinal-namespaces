# Cardinal Namespaces

[![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](https://github.com/cardinal-labs/cardinal-namespaces/blob/master/LICENSE)
[![Release](https://github.com/cardinal-labs/cardinal-namespaces/actions/workflows/release.yml/badge.svg?branch=v0.0.27)](https://github.com/cardinal-labs/cardinal-namespaces/actions/workflows/release.yml)

<p align="center">
    <img src="./images/banner.png" />
</p>

<p align="center">
    A protocol for minting NFTs and subscriptions
</p>

## Background

A namespace can be thought of as a rental dispenser with a templated set of parameters that allow the NFTs to be programmatically minted and rented on demand. Similar in ways to the Metaplex candy-machine, this works by minting the NFT and subsequently wrapping it in a token manager of the configured parameters. When it is returned to the namespace, it can be rented again by a new user.

- Usernames
  - In renting a username from a given namespace, you may be renting the right to play a game, access a service, or participate in a DAO. The username comes in the form of a managed NFT that sits in your wallet for the duration of the rental.
- Verified ownership
  - Holding a rented, managed NFT from a namespace that has previously verified your identity can allow you to assert proven ownership of something within that namespace.
- Subscriptions
  - A namespace can be setup to offer subscription-based access to gated content. When a user attempts to access the content, the provider can trivially check for ownership of the NFT.
- Keys / Tickets
  - A namespace could represent a room in a hotel for which temporary access could be rented out. The rented key could also have have a usage-based expiration and be used as a ticket to an event.
- Badges / Certificates
  - A namespace could be setup to rent out badges or certifications to a specific set of users. A user could be approved by the namespace and subsequently claim their badge that could be verified as issued and managed by that namespace.

## Packages

| Package                | Description                   | Version                                                                                                             | Docs                                                                                                            |
| :--------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- |
| `cardinal-namespaces`  | On-demand NFT minting         | [![Crates.io](https://img.shields.io/crates/v/cardinal-namespaces)](https://crates.io/crates/cardinal-namespaces)   | [![Docs.rs](https://docs.rs/cardinal-namespaces/badge.svg)](https://docs.rs/cardinal-namespaces)                |
| `@cardinal/namespaces` | TypeScript SDK for namespaces | [![npm](https://img.shields.io/npm/v/@cardinal/namespaces.svg)](https://www.npmjs.com/package/@cardinal/namespaces) | [![Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://cardinal-labs.github.io/cardinal-namespaces/) |

## Addresses

Program addresses are the same on devnet, testnet, and mainnet-beta.

- Namespaces: [`nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w`](https://explorer.solana.com/address/nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w)

## Getting Started

```
git clone https://github.com/cardinal-labs/cardinal-namespaces.git
cd cardinal-namespaces
make
```

## Documentation

**Namepsace**

Namespaces are the base component of the protocol. A namespace is a PDA owned by the program that forms a logical grouping of NFTs under a common name. Often similar to a TLD (top-level domain), but can the use of a namespace can vary widely. Essentially a namespace is the creator of tokens that belong in the namespace. It contians an authority who can update the parameters of the namespace, and when users claim entries in a namespace, they are issued by the namespace.

```
#[account]
pub struct Namespace {
    pub bump: u8,
    pub name: String,
    pub update_authority: Pubkey,
    pub rent_authority: Pubkey,
    pub approve_authority: Option<Pubkey>,
    pub schema: u8,
    pub payment_amount_daily: u64,
    pub payment_mint: Pubkey,
    pub min_rental_seconds: i64,
    pub max_rental_seconds: Option<i64>,
    pub transferable_entries: bool,
}
```

**Name Entry**

Namespaces are a collection of name entries. Each name entry stores information related to a specific name in a namespace. Most importantly, the name is derived from the name and the namespace, so every entry is unique to a given namespace. The entry mostly serves to map a string name to an NFT (mint address). Whoever is the holder of that NFT has the ability to set the entry data and also map their address back to that name using the reverse_entry.

Name entry NFTs are dynamically generated using cardinal-generator.

Name entries are issued by the namespace according to the paramaters of the namespace. The namespaces uses cardinal-token-manager to create revocable and expiring NFTs that represent each entry. This setup allows for subscriptions, and revocable badges issued by a namespace.

```
#[account]
pub struct Entry {
    pub bump: u8,
    pub namespace: Pubkey,
    pub name: String,
    pub data: Option<Pubkey>,
    pub reverse_entry: Option<Pubkey>,
    pub mint: Pubkey,
    pub is_claimed: bool,
    pub claim_request_counter: u32,
}
```

## Questions & Support

If you are developing using Cardinal namespaces contracts and libraries, feel free to reach out for support on Discord. We will work with you or your team to answer questions, provide development support and discuss new feature requests.

For issues please, file a GitHub issue.

> https://discord.gg/bz2SxDQ8

## License

Cardinal Protocol is licensed under the GNU Affero General Public License v3.0.

In short, this means that any changes to this code must be made open source and available under the AGPL-v3.0 license, even if only used privately.
