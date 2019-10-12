#!/usr/bin/env node
const program = require('commander');
const { version } = require('./package.json');

const initialize = async () => {
	const cli = await require('inquirer.module')();

	program.version(version);

	program
		.command('node')
		.description('Script to generate a new node.js application')
		.action( () => cli.node());

	program
		.command('commit')
		.description('Script to submit a Git commit with a prompted message')
		.action( () => cli.commit());

	program
		.command('exclude')
		.description('Script to add files to .git/info/exclude')
		.action( () => cli.exclude());

	program.parse(process.argv);

	if (!program.args.length) program.help();
}

initialize();