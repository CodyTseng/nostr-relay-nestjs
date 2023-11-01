# Nostr Relay NestJS

[![Coverage Status](https://coveralls.io/repos/github/CodyTseng/nostr-relay-nestjs/badge.svg?branch=master)](https://coveralls.io/github/CodyTseng/nostr-relay-nestjs?branch=master)

> **Warning**
> This project is still in development and is not ready for production use.

A Nostr relay with a clear architecture and high test coverage

Try here: wss://nostr-relay.app

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ooFSnW?referralCode=WYIfFr)

## Features

🟢 Full implemented 🟡 Partially implemented 🔴 Not implemented

| Feature                                                                                                 | Status | Note                                     |
| ------------------------------------------------------------------------------------------------------- | :----: | ---------------------------------------- |
| [NIP-01: Basic protocol flow description](https://github.com/nostr-protocol/nips/blob/master/01.md)     |   🟢   |                                          |
| [NIP-02: Contact List and Petnames](https://github.com/nostr-protocol/nips/blob/master/02.md)           |   🟢   |                                          |
| [NIP-04: Encrypted Direct Message](https://github.com/nostr-protocol/nips/blob/master/04.md)            |   🟢   |                                          |
| [NIP-09: Event Deletion](https://github.com/nostr-protocol/nips/blob/master/09.md)                      |   🔴   | No real deletion in a distributed system |
| [NIP-11: Relay Information Document](https://github.com/nostr-protocol/nips/blob/master/11.md)          |   🟢   |                                          |
| [NIP-13: Proof of Work](https://github.com/nostr-protocol/nips/blob/master/13.md)                       |   🟢   |                                          |
| [NIP-22: Event created_at Limits](https://github.com/nostr-protocol/nips/blob/master/22.md)             |   🟢   |                                          |
| [NIP-26: Delegated Event Signing](https://github.com/nostr-protocol/nips/blob/master/26.md)             |   🟢   |                                          |
| [NIP-28: Public Chat](https://github.com/nostr-protocol/nips/blob/master/28.md)                         |   🟢   |                                          |
| [NIP-40: Expiration Timestamp](https://github.com/nostr-protocol/nips/blob/master/40.md)                |   🟢   |                                          |
| [NIP-42: Authentication of clients to relays](https://github.com/nostr-protocol/nips/blob/master/42.md) |   🟢   |                                          |
| [NIP-45: Counting results](https://github.com/nostr-protocol/nips/blob/master/45.md)                    |   🔴   |                                          |
| [NIP-50: Keywords filter](https://github.com/nostr-protocol/nips/blob/master/50.md)                     |   🟢   |                                          |

## Extra Features

### TOP verb

TOP verb accepts a subscription id and filters as specified in [NIP 01](https://github.com/nostr-protocol/nips/blob/master/01.md) for the verb REQ.

```json
["TOP",<subscription_id>,<filters JSON>...]
```

And return the top N event IDs with the highest score (Scoring is determined by relay).

```json
["TOP",<subscription_id>,<event id array>]
```

Example:

```json
["TOP","test",{"search":"nostr bitcoin","kinds":[30023],"limit":10}]

["TOP","test",["2359f4bdfe0bd2353aa7702dc1af23279197694823b8b4916b904a9940334192","622a875c9f9a4696eb4050fa5b0bba3a9b0531ec4a27398245af7369e6d40da8","d8989c65d26511b2e3ea42b0ebfcaf0ea885cb958419df4ddb334cb72556f950","ffcb0c9e0ace0b5d3928f30395bc9832763f8b583f2b1beb696f7c199f9f94d2","287147867bd00299553fa91e110d40206eea19a9142a4283832ee67e1407e6f2","ffaea8bc3b08db32af97f1ff595e68eee8a2f7b0a4a66dc2eff330f450855f6c","cddbc6cd4a0589d4a593e99a3a94426c85c6867b47d7eb751ce419c27f079b76","f2291ac6d206e898965b9e4ba6bbe5bb10118e6a74bd9f9f13597813979a254b","a101a2a44938dbb0a611bc00bd7ed4cb44d682fea4c14618bd1148567cd6fcc3","21990a723b491b6c594438a2ecf5d5e4898212635f59e82f1c736d994a86e907"]]
```

## Quick Start

### Dockerfile

Build image

```bash
docker build -t nostr-relay-nestjs .
```

Create `.env` file based on `.env.example` file

```.env
DOMAIN=localhost
DATABASE_URL="postgresql://username:xxxxxxxxxx@host:port/database"
```

Run container

```bash
docker run -d -p 3000:3000 --env-file .env --name nostr-relay-nestjs nostr-relay-nestjs
```

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
