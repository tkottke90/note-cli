#!/usr/bin/env node
const [,, command, ...args] = process.argv;

const initialize = async () => {
	const cli = await require('inquirer.module')();

	cli.commit();

}

console.clear();
initialize();