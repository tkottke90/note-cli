const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const { promisify } = require('util');

/* -- Promisified Functions -- */
const exec = promisify(child.exec);
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);

/* -- Utility Functions -- */
const getGitLocation = async () => {
	try {
		const { stdout } = await exec('git rev-parse --show-toplevel', { cwd: process.cwd() });
		return stdout.split('\n')[0];
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

const gitRepo = async () => {
	if (!(await checkGit())) {
		console.error(`${chalk.red('Invalid Directory - Missing GIT!')}`);
		process.exit(1);
	}
}

const notableParse = async () => {
	// Check cwd for .notable_dir flag
	const gitDir = await getGitLocation();
	const notableFlag = await exists(path.join(gitDir, '.notable_dir'));
	const notes = await exists(path.join(gitDir, 'notes'));
	const attachments = await exists(path.join(gitDir, 'attachments'));

	if (!gitDir || !notableFlag || !notes || !attachments) {
		console.log(`\n${chalk.blue('!!')} Not a Notable Directory \n\n${ !gitDir ? '  - Initialize git for this directory\n' : '' }${ !notableFlag ? '  - Tag this as a notable directory by adding the .notable_dir flag with: echo >> .notable_dir\n' : '' }${ !notes ? '  - A "notes" directory is required\n' : '' }${ !attachments ? '  - An "attachments" directory is required' : '' }\n`)
		process.exit(0);
	}

	const cwd = path.join(gitDir, 'notes');

	const files = await readDir(cwd);

	console.log(files);

	files.map( async filename => {
		const data = await readFile(path.join(cwd, filename));

		const dataArr = data.split('\n');

	});

	const tableWidths = {
		filenames: files.reduce( (acc, cur) => acc > cur.name.length ? acc : cur.name.length, 1),
	}

}

/* -- Module Functions -- */
const excludeList = async () => {
	console.log(chalk.hex('#BA5B50')(outputHeader(['Add files to Git Exclude file', '','   https://help.github.com/en/articles/ignoring-files#explicit-repository-excludes'])));
	
	// Check if cwd is a git repository
	await gitRepo()

	const { stdout: files } = await exec('git status -su', { cwd: process.cwd() });

	const fileList = files.split('\n').filter( item => item.length > 1 && item.startsWith('?')).map( item => item.slice(3));

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
	const exclude = `${git}/.git/info/exclude`;

	try {
		let excludeFile = await readFile(exclude, 'utf8');
	
		excludeFile += `\n${answers.files.join('\n').replace('"', '')}`;
	
		const result = await writeFile(exclude, excludeFile, { encoding: 'utf8' });
	
		console.log(chalk.hex('#BA5B50')(`\nSuccessfully Updated Exclude File!\n${answers.files.map( item => `  - ${item}`).join('\n')}`));
	} catch (err) {
		console.error(chalk.red('Error Updating Exclude File!'), ` - ${err}`);
	}
}

const commitPrompt = async () => {
	console.log(chalk.hex('#BA5B50')(outputHeader(['Generate a new commit'])));

	// Check if cwd is a git repository
	await gitRepo()

	const commitTypes = [ 
		{ name: `feat      ${chalk.grey('(A new Feature)')}`, value: 'feat' },
		{ name: `refactor  ${chalk.grey('(A code change that neither fixes a bug nor adds a feature)')}`, value: 'refactor'},
		...[
			{ name: `merge     ${chalk.grey('(A merging of 2 git branches)')}`, value: 'merge'},
			{ name: `fix       ${chalk.grey('(A bug fix)')}`, value: 'fix'},
			{ name: `docs      ${chalk.grey('(Documentation only changes)')}`, value: 'docs'},
			{ name: `build/cli ${chalk.grey('(Changes that affect the build/ci system)')}`, value: 'build/ci'},
			{ name: `chore     ${chalk.grey('(Other changes that don\'t modify src or test files)')}`, value: 'chore'},
			{ name: `revert    ${chalk.grey('(Reverts a previous commit)')}`, value: 'revert'},
			{ name: `test      ${chalk.grey('(Adding missing tests or correcting existing tests)')}`, value: 'test'},
			{ name: `style     ${chalk.grey('(Changes that do not affect the meaning of the code)')}`, value: 'style'}
		].sort( (a, b) => a.name > b.name ? 1 : -1 )];	
	const { stdout: files } = await exec('git status -su', { cwd: process.cwd() });

	const fileList = files.split('\n').filter( item => item.length > 1).map( item => {
		const parts = item.slice(3);

		return `${parts}`;
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
			message: 'Select the type of commit',

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

	let commit = [
		`${answers.type}:${answers.message}`,
		'## Git Commit Template v1.0',
		'## Author: Thomas Kottke <admin@tdkottke.com>',
		'## Template supports the logging of information related to the ',
		'##    ticket based on multiple git commit template philosophies',
		'',
		'# Files committed:',
		answers.files.map( file => `  - ${file}`).join('\n'),
		'',
		'# Ticketing System Information',
		`${answers.ticket === 'N/A' ? '  # ticket: <tracking ticket>' : `  ticket: ${answers.ticket}`}`,
		'',
		'# Commit Summery:',
		'# Why is the change necessary?',
		`${answers.why}`,
		'',
		'# How does it address the issue?',
    `    ${answers.how}`,
		'',
		`# What side effects does this change have?`,
	  `    ${answers.side_effects}`
	];

	// Check commit to ensure that all lines are less than 72 characters, if not wrap
	commit = commit.reduce( (acc, cur) => {
		if (cur.length < 72 || cur.charAt(0) === '#') {
			return [ ...acc, `${cur}` ];
		}

		let output = [];
		const length = cur.length;
		const max = 68;
		const pages = Math.ceil(length / max);
		for (let i = 0; i < pages; i++) {
			let start = i * max;
			let end = start + max;

			// While the current character at the position of start is not a space or new line move back 1 character
			while( ![' ', '\n'].includes(cur.slice(start, (start + 1))) && start !== 0 ) {
				start -= 1;
			}

			while( ![' ', '\n'].includes(cur.slice(end, (end + 1))) && end !== start ) {
				end -= 1;
			}

			console.log({
				start,
				end: {
					isSpecialChar: [' ', '\n'].includes(cur.slice(end, (end + 1))),
					char: cur.slice(end, (end + 1))
				},
				slice: cur.slice(start, end)
			})

			output.push(`    ${cur.slice( start, end )}`);
		}

		return [ ...acc, ...output ];
	}, []);

	console.log('\n', chalk.blue(commit.join('\n')), '\n');

	const confirm = await inquirer.prompt([
		{
			type: 'confirm',
			default: false,
			name: 'value',
			message: 'Does this commit look correct?'
		}
	]);

	if (!confirm.value){
		console.log(chalk.blue('\n Aborting Commit \n'));
		return;
	}

	try {
		await exec(`git add ${answers.files.join(' ')}`);
		await exec(`git commit -m "${commit.join('\n')}"`);
	} catch (err) {
		console.log(chalk.red('Error Committing Files!'));
		console.error(err);
		process.exit(1);
	}


}

const generateNodeApp = async () => {
	console.log(chalk.hex('#BA5B50')(outputHeader(['Generate New Node App'])));
	
	// Get name of application
	let answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'name',
			message: 'Enter name of your new node application'
		}
	]);

	answers.path = [ '/home' ];

	let dirNotSelected = true;
	while (dirNotSelected) {
			const files = await readDir(path.join(...answers.path));
			const choices = [ ...files.filter( item => !item.startsWith('.')), new inquirer.Separator(), { name: 'Up 1 Level', value: '..' }, { name: 'Submit', value: true } ];

			const { location } = await inquirer.prompt([
				{
					type: 'list',
					name: 'location',
					message: 'Select a directory or Submit to continue',
					choices,
					pageSize: choices.length
				}
			]);

			if (location === '') {
				return answers.path.pop();
			}

			if (typeof location === 'boolean') {
				dirNotSelected = false;
				answers.path = answers.path.join('/');
				return;
			}

			answers.path.push(location);
	} 

	console.log(answers);
}

/* -- Module Functions -- */
module.exports = async () => {
	return {
		exclude: excludeList,
		commit: commitPrompt,
		notable: notableParse,
		node: generateNodeApp
	}
}