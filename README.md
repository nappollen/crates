# 📦 A Game About Crates — Save Tool

[![CI](https://github.com/nappollen/crates/actions/workflows/ci.yml/badge.svg)](https://github.com/nappollen/crates/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/nappollen/crates/actions/workflows/pages.yml/badge.svg)](https://github.com/nappollen/crates/actions/workflows/pages.yml)
[![VRChat World](https://img.shields.io/badge/VRChat-A%20Game%20About%20Crates-1f8b4c?logo=vrchat&logoColor=white)](https://vrchat.com/home/world/wrld_9907d48d-47e6-4139-b859-297396ed0f13)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Backup and restore your save file for [**A Game About Crates**](https://vrchat.com/home/world/wrld_9907d48d-47e6-4139-b859-297396ed0f13) by [_Froggi](https://vrchat.com/home/user/usr_1f6a7514-3435-479d-b956-2efb6f1c2274) on VRChat.

The game uses a proprietary **ENC1** encryption format for save data (reverse-engineered from the Udon assembly). This repo provides:

- A **browser-based tool** (GitHub Pages) — no install needed
- **Python CLI** tools (`decrypt.py` / `crypt.py`)
- **Node.js CLI** tools (`decrypt.js` / `crypt.js`)

---

## Web UI

👉 **[Open the Save Tool](https://nappollen.github.io/crates/)**

Decrypt and re-encrypt saves entirely in your browser — nothing is uploaded anywhere.

---

## CLI Usage

All four CLI tools share the same interface and produce identical output. Use whichever runtime you have available.

### Decrypt

```bash
node decrypt.js <save.txt> <PlayerName> [--key KEY] [--output FILE]
```

**Example:**
```bash
node decrypt.js save.txt Nappollen
# → save_decoded.json
```

### Encrypt (re-pack)

```bash
node crypt.js <decoded.json> <PlayerName> [--key KEY] [--output FILE]
```

**Example:**
```bash
node crypt.js save_decoded.json Nappollen
# → save_decoded_coded.txt
```

### Arguments

| Argument | Description |
|---|---|
| `<input>` | Path to the ENC1 save file (`save.txt`) |
| `<PlayerName>` | Your VRChat display name — **case-sensitive** |
| `--key KEY` | Encryption key (default: `K9#mXqL2$vRnT5@w`) |
| `--output FILE` | Output path (auto-generated if omitted) |

---

## Algorithm

The save format was reverse-engineered from the VRChat SaveSystem Udon assembly.

```
ENC1: <hexCipher> <checksum4hex>
```

- **Checksum**: `sum(plaintextBytes) & 0xFFFF`
- **Seed derivation** (`DeriveKeyFromSeed`): `seed[i] = (31 × charCode(seedStr[i]) + 7 × i) & 0xFF`  
  where `seedStr = encKey + playerName`
- **State init**: `stateInit = (seed[0] << 8) | seed[1]`
- **LCG keystream**: `state = (state × 0x0019660D + 0x3C6EF35F) & 0x7FFFFFFF`  
  `key[i] = (state ^ seed[i % seedLen]) & 0xFF`
- **Cipher**: XOR of plaintext bytes with keystream

---

## Requirements

| Tool | Requirement |
|---|---|
| Node.js CLI | Node.js 11+ |
| Browser tool | Any modern browser |

---

## License

[MIT](LICENSE) © 2026 [Nappollen](https://nappollen.github.io/)
