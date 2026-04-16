import { readFileSync, writeFileSync } from 'node:fs';

const distDir = new URL('../dist/', import.meta.url);

for (const relativeFile of [
  'index.js',
  'client.js',
  'http.js',
  'react.js',
  'index.d.ts',
  'client.d.ts',
  'http.d.ts',
  'react.d.ts',
  'internal/runtime-primitives.js',
  'internal/runtime-primitives.d.ts',
]) {
  const fileUrl = new URL(relativeFile, distDir);
  const source = readFileSync(fileUrl, 'utf8');
  const next = source
    .replaceAll('from "./client"', 'from "./client.js"')
    .replaceAll("from './client'", "from './client.js'")
    .replaceAll('from "./http"', 'from "./http.js"')
    .replaceAll("from './http'", "from './http.js'")
    .replaceAll(
      'from "../../../wp-typia-api-client/dist/runtime-primitives.js"',
      'from "@wp-typia/api-client/runtime-primitives"',
    )
    .replaceAll(
      "from '../../../wp-typia-api-client/dist/runtime-primitives.js'",
      "from '@wp-typia/api-client/runtime-primitives'",
    )
    .replaceAll(
      'from "../../wp-typia-api-client/dist/client-utils.js"',
      'from "@wp-typia/api-client/client-utils"',
    )
    .replaceAll(
      "from '../../wp-typia-api-client/dist/client-utils.js'",
      "from '@wp-typia/api-client/client-utils'",
    );

  if (next !== source) {
    writeFileSync(fileUrl, next);
  }
}
