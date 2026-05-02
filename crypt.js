#!/usr/bin/env node
/**
 * Re-encrypt a decoded JSON save back to ENC1 format.
 *
 * Usage:
 *   node crypt.js <decoded_json> <player_name> [--key KEY] [--output FILE]
 *
 * Arguments:
 *   decoded_json   Decoded JSON file to re-encrypt (e.g. save_decoded.json)
 *   player_name    VRChat display name of the player (case-sensitive)
 *   --key KEY      Encryption key (default: K9#mXqL2$vRnT5@w)
 *   --output FILE  Output file (default: <decoded_json stem>_coded.txt)
 *
 * Example:
 *   node crypt.js save_decoded.json Nappollen
 *   node crypt.js save_decoded.json Nappollen --output save_new.txt
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { encrypt, DEF_KEY } = require('./crypto.js');

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
    'Usage: node crypt.js <decoded_json> <player_name> [--key KEY] [--output FILE]\n'
  );
  process.exit(1);
}

const [inputFile, playerName] = positional;
const encKey  = options.key    || DEF_KEY;
const outFile = options.output || path.join(
  path.dirname(inputFile),
  path.basename(inputFile, path.extname(inputFile)) + '_coded.txt'
);

const jsonText = fs.readFileSync(inputFile, 'utf8');

try {
  const result = encrypt(jsonText, playerName, encKey);
  fs.writeFileSync(outFile, result, 'utf8');
  const bytes = (result.length - 9) >>> 1;
  process.stdout.write(`Encrypted — ${bytes} bytes → ${outFile}\n`);
} catch (e) {
  process.stderr.write('ERROR: ' + e.message + '\n');
  process.exit(1);
}
