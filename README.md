# walrus-demo

quick demo showing read/write to [walrus](https://www.walrus.xyz/) (decentralized blob storage on sui).

## what it does

- stores arbitrary text on walrus via the publisher HTTP API
- retrieves it back using blob IDs via the aggregator
- keeps a local history of stored blobs in localstorage
- links back to sui explorer for on-chain verification

## how walrus works (tldr)

walrus splits your data into shards using erasure coding (RedStuff) and distributes them across ~2200 storage nodes. you only need ~1/3 of shards to reconstruct. storage duration is measured in epochs (~24h each). everything is anchored on sui — blob metadata, storage payments, certifications.

two main HTTP endpoints:
- **publisher** (`PUT /v1/blobs?epochs=N`) — stores data, returns blob ID + sui object/tx reference
- **aggregator** (`GET /v1/blobs/<id>`) — reconstructs and returns the blob

the response from store is either `newlyCreated` (first time) or `alreadyCertified` (already exists, deduped). walrus is content-addressed so identical data = same blob ID.

## run it

just open `index.html`. it's a static page, no build step, no dependencies. hits the walrus testnet publisher/aggregator directly from the browser.

```
open index.html
# or
python3 -m http.server 8080
```

uses these public testnet endpoints:
- publisher: `https://publisher.walrus-testnet.walrus.space`
- aggregator: `https://aggregator.walrus-testnet.walrus.space`

## structure

```
index.html   — markup
style.css    — dark theme, nothing fancy
app.js       — walrus interaction logic (~130 lines)
```

## notes

- testnet only. publisher is rate-limited and capped at 10MB per blob.
- epochs are testnet epochs, not mainnet. data won't persist forever.
- no wallet integration needed for reads. publisher handles writes via its own sub-wallets on testnet.
- walrus mainnet uses WAL tokens for storage payment.

## links

- [walrus docs](https://docs.wal.app/)
- [walrus HTTP API](https://docs.wal.app/usage/web-api.html)
- [sui](https://sui.io/)
- [walrus whitepaper (redstuff encoding)](https://docs.wal.app/walrus.pdf)
