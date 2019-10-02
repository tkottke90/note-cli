const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const child = require('child_process');
const { promisify } = require('util');

const exec = promisify(child.exec);

const checkGit = async () => {
	try {
		return !!(await exec('git status', {cwd: process.cwd() }));
	} catch (error) {
		return false;
	}
};

const excludeList = async () => {
	const files = await exec('git status -s', { cwd: process.cwd() });

	console.log(files);
}

module.exports = async () => {
	if (!(await checkGit())) {
		console.error(`${chalk('Invalid Directory - Missing GIT!')}`);
		process.exit(1);
	}

	return {
		exclude: excludeList
	}
}