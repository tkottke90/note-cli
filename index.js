#!/usr/bin/env node
const [,, command, ...args] = process.argv;

const initialize = async () => {
	const cli = await require('inquirer.module')();

	if (!cli[command]) {
		console.log(`

Invalid Command: ${command}
		

Usage: update-notes <command> [options]

Commands:
  exclude - add untracked files to local file exclusion .git/info/exclude
  commit - cli interface for generating and committing files
		`);
		process.exit(0);
	}

	cli[command]();

}

console.clear();
console.log('--- Note-CLI Tool ---')
initialize();