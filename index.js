#!/usr/bin/env node
const cli = require('./modules/inquirer')();

const [,, command, ...args] = process.argv;

cli.exclude();