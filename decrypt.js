#!/usr/bin/env node
/**
 * Decrypt a VRChat SaveSystem ENC1 save file.
 *
 * Usage:
 *   node decrypt.js <input> <player_name> [--key KEY] [--output FILE]
 *
 * Arguments:
 *   input          Encrypted save file (ENC1: format)
 *   player_name    VRChat display name of the player (case-sensitive)
 *   --key KEY      Encryption key (default: K9#mXqL2$vRnT5@w)
 *   --output FILE  Output file (default: <input stem>_decoded.json)
 *
 * Example:
 *   node decrypt.js save.txt Nappollen
 *   node decrypt.js save.txt Nappollen --output out.json
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { decrypt, DEF_KEY } = require('./crypto.js');

function parseArgs(argv) {
  const positional = [];
  const options    = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      options[argv[i].slice(2)] = argv[++i];
    } else {
      positional.push(argv[i]);
    }
  }
  return { positional, options };
}

const { positional, options } = parseArgs(process.argv.slice(2));

if (positional.length < 2) {
  process.stderr.write(
    'Usage: node decrypt.js <input> <player_name> [--key KEY] [--output FILE]\n'
  );
  process.exit(1);
}

const [inputFile, playerName] = positional;
const encKey  = options.key    || DEF_KEY;
const outFile = options.output || path.join(
  path.dirname(inputFile),
  path.basename(inputFile, path.extname(inputFile)) + '_decoded.json'
);

const raw = fs.readFileSync(inputFile, 'utf8').trim();

try {
  const { json, keys, warning } = decrypt(raw, playerName, encKey);
  if (warning) process.stderr.write('WARNING: ' + warning + '\n');
  fs.writeFileSync(outFile, json, 'utf8');
  process.stdout.write(`Decrypted — ${keys} keys → ${outFile}\n`);
} catch (e) {
  process.stderr.write('ERROR: ' + e.message + '\n');
  process.exit(1);
}
