#!/usr/bin/env node

import { parseCliArgs } from './args.js';
import { run } from './cli.js';

const ok = await run(parseCliArgs());
if (!ok) process.exit(1);
