# A Game About Crates — Save Tool

Backup and restore your save file for [**A Game About Crates**](https://vrchat.com/home/world/wrld_9907d48d-47e6-4139-b859-297396ed0f13) by [_Froggi](https://vrchat.com/home/user/usr_1f6a7514-3435-479d-b956-2efb6f1c2274) on VRChat.

The game uses a proprietary **ENC1** encryption format for save data (reverse-engineered from the Udon assembly). This repo provides:

- A **browser-based tool** (GitHub Pages) — no install needed
- **Python CLI** tools (`decrypt.py` / `crypt.py`)
- **Node.js CLI** tools (`decrypt.js` / `crypt.js`)

> See also [**nappollen/crates**](https://github.com/nappollen/crates) for related work.

---

## Web UI

👉 **[Open the Save Tool](https://Nappollen.github.io/crate/)**

Decrypt and re-encrypt saves entirely in your browser — nothing is uploaded anywhere.

---

## CLI Usage

All four CLI tools share the same interface and produce identical output. Use whichever runtime you have available.

### Decrypt

```bash
# Python
python decrypt.py <save.txt> <PlayerName> [--key KEY] [--output FILE]

# Node.js
node decrypt.js <save.txt> <PlayerName> [--key KEY] [--output FILE]
```

**Example:**
```bash
python decrypt.py save.txt Nappollen
# → save_decoded.json

node decrypt.js save.txt Nappollen --output out.json
```

### Encrypt (re-pack)

```bash
# Python
python crypt.py <decoded.json> <PlayerName> [--key KEY] [--output FILE]

# Node.js
node crypt.js <decoded.json> <PlayerName> [--key KEY] [--output FILE]
```

**Example:**
```bash
python crypt.py save_decoded.json Nappollen
# → save_decoded_coded.txt

node crypt.js save_decoded.json Nappollen --output save_new.txt
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
| Python CLI | Python 3.8+ |
| Node.js CLI | Node.js 11+ |
| Browser tool | Any modern browser |

---

## License

[MIT](LICENSE) © 2026 Nappollen
