const inquirer = require('inquirer');
const path = require('path');
const child = require('child_process');
const { promisify } = require('util');

const exec = promisify(child.exec);

const excludeList = async () => {
	const files = await exec('git status -s', { cwd: process.cwd() });

	console.log(files);
}

module.exports = () => {
	return {
		exclude: excludeList
	}
}