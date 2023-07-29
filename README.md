# Nostr Relay NestJS

[![Coverage Status](https://coveralls.io/repos/github/CodyTseng/nostr-relay-nestjs/badge.svg?branch=master)](https://coveralls.io/github/CodyTseng/nostr-relay-nestjs?branch=master)

> **Warning**
> This project is still in development and is not ready for production use.

A Nostr relay with a clear architecture and high test coverage

Try here: wss://nostr-relay.app

## Quick Start

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ooFSnW?referralCode=WYIfFr)

## Features

🟢 Full implemented 🟡 Partially implemented 🔴 Not implemented

| Feature                                                                                                 | Status | Note                        |
| ------------------------------------------------------------------------------------------------------- | :----: | --------------------------- |
| [NIP-01: Basic protocol flow description](https://github.com/nostr-protocol/nips/blob/master/01.md)     |   🟢   |                             |
| [NIP-02: Contact List and Petnames](https://github.com/nostr-protocol/nips/blob/master/02.md)           |   🟢   |                             |
| [NIP-04: Encrypted Direct Message](https://github.com/nostr-protocol/nips/blob/master/04.md)            |   🟢   |                             |
| [NIP-09: Event Deletion](https://github.com/nostr-protocol/nips/blob/master/09.md)                      |   🟢   |                             |
| [NIP-11: Relay Information Document](https://github.com/nostr-protocol/nips/blob/master/11.md)          |   🟢   |                             |
| [NIP-12: Generic Tag Queries](https://github.com/nostr-protocol/nips/blob/master/12.md)                 |   🟢   |                             |
| [NIP-13: Proof of Work](https://github.com/nostr-protocol/nips/blob/master/13.md)                       |   🟢   |                             |
| [NIP-16: Event Treatment](https://github.com/nostr-protocol/nips/blob/master/16.md)                     |   🟢   |                             |
| [NIP-20: Command Results](https://github.com/nostr-protocol/nips/blob/master/20.md)                     |   🟢   |                             |
| [NIP-22: Event created_at Limits](https://github.com/nostr-protocol/nips/blob/master/22.md)             |   🟡   | Restrict future events only |
| [NIP-26: Delegated Event Signing](https://github.com/nostr-protocol/nips/blob/master/26.md)             |   🟢   |                             |
| [NIP-28: Public Chat](https://github.com/nostr-protocol/nips/blob/master/28.md)                         |   🟢   |                             |
| [NIP-33: Parameterized Replaceable Events](https://github.com/nostr-protocol/nips/blob/master/33.md)    |   🟢   |                             |
| [NIP-40: Expiration Timestamp](https://github.com/nostr-protocol/nips/blob/master/40.md)                |   🟢   |                             |
| [NIP-42: Authentication of clients to relays](https://github.com/nostr-protocol/nips/blob/master/42.md) |   🟢   |                             |
| [NIP-45: Counting results](https://github.com/nostr-protocol/nips/blob/master/45.md)                    |   🟢   |                             |
| [NIP-50: Keywords filter](https://github.com/nostr-protocol/nips/blob/master/50.md)                     |   🟡   | Not support prefixes        |

## TODO

- [x] Unit test
- [ ] Metrics, Monitoring and Alerting
- [ ] Support multi nodes
- [ ] Support for Bitcoin Lightning Network payments

## Architecture

![structure light](https://github.com/CodyTseng/resources/raw/master/nostr-relay-nestjs/img/structure-light.png#gh-light-mode-only)

![structure dark](https://github.com/CodyTseng/resources/raw/master/nostr-relay-nestjs/img/structure-dark.png#gh-dark-mode-only)

## Donate

If you like this project, you can buy me a coffee :) ⚡️ codytseng@getalby.com ⚡️

## License

This project is MIT licensed.
