"""
Decrypt a VRChat SaveSystem ENC1 save file.

Usage:
  python direct_recover.py <input> <player_name> [--key KEY] [--output OUTPUT]

Arguments:
  input          Encrypted save file (e.g. save.txt)
  player_name    VRChat display name of the player (case-sensitive)
  --key KEY      Encryption key (default: K9#mXqL2$vRnT5@w)
  --output FILE  Output file (default: <input stem>_decoded.txt)

Example:
  python direct_recover.py save.txt Nappollen
  python direct_recover.py save.txt Nappollen --output out.json
"""
import argparse
import json
import sys

MULT, ADD, MASK = 0x0019660D, 0x3C6EF35F, 0x7FFFFFFF
DEFAULT_KEY = "K9#mXqL2$vRnT5@w"


def derive_seed(seed_str):
    """
    Derive the seed array from the seed string (encKey + playerName).
    Algorithm reverse-engineered from Udon assembly (SaveSystem):
      seed[i] = (31 * ord(seedStr[i]) + 7 * i) & 0xFF
    """
    return [(31 * ord(c) + 7 * i) & 0xFF for i, c in enumerate(seed_str)]



def decrypt(cipher, seed_arr, state_init):
    N = len(cipher)
    seed_len = len(seed_arr)
    state = state_init
    plain = []
    for i in range(N):
        state = (state * MULT + ADD) & MASK
        key_byte = (state ^ seed_arr[i % seed_len]) & 0xFF
        plain.append(cipher[i] ^ key_byte)
    return bytes(plain)


def main():
    parser = argparse.ArgumentParser(
        description="Decrypt a VRChat SaveSystem ENC1 save file.",
    )
    parser.add_argument("input", help="Encrypted save file (ENC1: format)")
    parser.add_argument("player_name", help="VRChat display name of the player (case-sensitive)")
    parser.add_argument("--key", default=DEFAULT_KEY,
                        help=f"Encryption key (default: {DEFAULT_KEY})")
    parser.add_argument("--output",
                        help="Output file (default: <input stem>_decoded.txt)")
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        raw = f.read().strip()
    if not raw.startswith("ENC1:"):
        print("ERROR: file does not start with 'ENC1:'", file=sys.stderr)
        sys.exit(1)
    checksum_hex = raw[-4:]
    cipher = bytes.fromhex(raw[5:-4])
    N = len(cipher)

    seed_arr = derive_seed(args.key + args.player_name)
    state_init = seed_arr[0] << 8 | seed_arr[1]

    plaintext_bytes = decrypt(cipher, seed_arr, state_init)

    computed = sum(plaintext_bytes) & 0xFFFF
    expected = int(checksum_hex, 16)
    if computed != expected:
        print(f"WARNING: checksum mismatch (computed {computed:04x}, expected {checksum_hex})",
              file=sys.stderr)

    plaintext = plaintext_bytes.decode("utf-8", errors="replace")

    try:
        obj = json.loads(plaintext)
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON parse failed at pos {e.pos}: {e.msg}", file=sys.stderr)
        print(f"Context: ...{plaintext[max(0, e.pos-40):e.pos+40]!r}...", file=sys.stderr)
        sys.exit(1)

    stem = args.input.rsplit(".", 1)[0] if "." in args.input else args.input
    output_path = args.output or f"{stem}_decoded.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(obj, indent=2, ensure_ascii=False))

    print(f"Decrypted {N} bytes -> {len(obj)} JSON keys -> {output_path}")


if __name__ == "__main__":
    main()