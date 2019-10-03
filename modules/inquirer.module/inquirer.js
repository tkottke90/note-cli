const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const { promisify } = require('util');

/* -- Promisified Functions -- */
const exec = promisify(child.exec);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/* -- Utility Functions -- */
const getGitLocation = async () => {
	try {
		const { stdout } = await exec('git rev-parse --show-toplevel', { cwd: process.cwd() });
		return stdout;
	} catch (error) {
		return false;
	}
}

const checkGit = async () => {
	try {
		return !!(await exec('git status', { cwd: process.cwd() }));
	} catch (error) {
		return false;
	}
};

const outputHeader = headerText => {
	let width = 1;
	let output = '';

	if (typeof headerText === 'string') {
		width = headerText.length;
		output = headerText;
	} else {
		width = headerText.reduce( (acc, cur) => acc > cur.length ? acc : cur.length, 0);
		output = headerText.map( item => 
			`│ ${item}${' '.repeat((width - item.length))} │`
		).join('\n');
	}

	const widthStr = '─'.repeat(width + 2);

	return `┌${widthStr}┐\n${output}\n└${widthStr}┘`;
}

/* -- Module Functions -- */
const excludeList = async () => {
	console.log(chalk.hex('#BA5B50')(outputHeader(['Add files to Git Exclude file', '','   https://help.github.com/en/articles/ignoring-files#explicit-repository-excludes'])));
	
	const { stdout: files } = await exec('git status -su', { cwd: process.cwd() });

	const fileList = files.split('\n').filter( item => item.length > 1 && item.startsWith('?')).map( item => item.split(' ')[1]);

	if (fileList.length === 0) {
		console.log(`\n${chalk.blue('!!')} No Untracked Files in repository \n`)
		process.exit(0);
	}

	const answers = await inquirer.prompt([
		{
			type: 'checkbox',
			name: 'files',
			choices: fileList,
			message: `Select files to exclude in your /.git/info/exclude file`,
			validate: (answers) => {
				return answers.length > 0 ? true : 'You must select at least one file'
			}
		}
	]);

	const git = await getGitLocation();
	const exclude = `${git.split('\n')[0]}/.git/info/exclude`;

	try {
		let excludeFile = await readFile(exclude, 'utf8');
	
		excludeFile += `\n${answers.files.join('\n')}`;
	
		const result = await writeFile(exclude, excludeFile, { encoding: 'utf8' });
	
		console.log(chalk.hex('#BA5B50')(`\nSuccessfully Updated Exclude File!\n${answers.files.map( item => `  - ${item}`).join('\n')}`));
	} catch (err) {
		console.error(chalk.red('Error Updating Exclude File!'), ` - ${err}`);
	}
}

const commitPrompt = async () => {
	console.log(chalk.hex('#BA5B50')(outputHeader(['Generate a new commit'])));

	const commitTypes = [ 'feat', 'refactor', 'merge', 'fix', 'docs', 'build/ci', 'chore', 'revert', 'test' ].sort();	
	const { stdout: files } = await exec('git status -su', { cwd: process.cwd() });

	const fileList = files.split('\n').filter( item => item.length > 1).map( item => {
		const parts = item.split(' ');

		return parts[parts.length - 1];
	});

	if (fileList.length === 0) {
		console.log(`\n${chalk.blue('!!')} No Untracked Files in repository \n`)
		process.exit(0);
	}

	const answers = await inquirer.prompt([
		{
			type: 'checkbox',
			name: 'files',
			choices: fileList,
			message: `Select files to commit`,
			validate: (answers) => {
				return answers.length > 0 ? true : 'You must select at least one file'
			}
		},
		{
			type: 'list',
			name: 'type',
			choices: commitTypes,
			message: 'Select the type of commit'
		},
		{
			type: 'input',
			name: 'message',
			message: 'Enter a commit message (50 char max)',
			validate: (answer) => {
				return answer.length < 50 ? true : 'Commit messages must be less than 50 characters'
			}
		},
		{
			type: 'input',
			name: 'ticket',
			default: "N/A",
			message: '(optional) Enter the tracking ticket number:',
			when: (res) => {
				return res !== 'N/A' || res !== 'n/a'; 
			}
		},
		{
			type: 'input',
			name: 'why',
			default: "N/A",
			message: '(optional) Enter description of why the commit is being submitted:',
			when: (res) => {
				return res !== 'N/A' || res !== 'n/a'; 
			}
		},
		{
			type: 'input',
			name: 'how',
			default: "N/A",
			message: '(optional) Enter description of how the commit addresses the issue:',
			when: (res) => {
				return res !== 'N/A' || res !== 'n/a'; 
			}
		},
		{
			type: 'input',
			name: 'side_effects',
			default: "N/A",
			message: '(optional) Enter any possible problems related to this the addition of this commit:',
			when: (res) => {
				return res !== 'N/A' || res !== 'n/a'; 
			}
		}
	]);

	console.dir(answers);

	const commit = 
		`${answers.type}:${answers.message}
## Git Commit Template v1.0
## Template supports the logging of information related to the ticket based on multiple git commit template philosophies

# Files committed:
${answers.files.map( file => `\t- ${file}`).join('\n')}

# Ticketing System Information
  ${answers.ticket === 'N/A' ? '# ticket: <tracking ticket>' : `ticket: ${answers.ticket}`}

# Summery:
  Why is this change necessary?
	  ${answers.why}
	How does it address the issue?
    ${answers.why}
	What side effects does this change have?
	  ${answers.side_effects}
		`

	console.log({
		add: `git add ${answers.files.join(' ')}`,
		commit: `git commit -m ${commit}`
	});

	try {
		const { stdout: addStdout } = await exec(`git add ${answers.files.join(' ')}`);
		const { stdout } = await exec(`git commit -m '${commit}'`);
	
	} catch (err) {
		console.log(chalk.red('Error Committing Files!'));
		console.error(err);
		process.exit(1);
	}


}

/* -- Module Functions -- */
module.exports = async () => {
	if (!(await checkGit())) {
		console.error(`${chalk.red('Invalid Directory - Missing GIT!')}`);
		process.exit(1);
	}

	return {
		exclude: excludeList,
		commit: commitPrompt
	}
}