# Note-CLI Tool

This tool is designed to provide a basic user interface to the command line to be used in conjunction with Git to maintain a repository and good commit information

## Install

Clone the Repository:
`git clone git@github.com:tkottke90/note-cli.git`

Run npm install
`npm install`

Link bin folder to your terminal
`npm link`

## Usage

Once you have installed the tool,  you can use by running this command in your terminal:
`update-notes <command>`

## Commands

1. <a href="#exclude">Exclude</a> - The add files to git's exclude file (/.git/info/exclude)
2. <a href="#commit">Commit</a> - A command line to to walk through the creation and submittion of a commit


<h3 id="exclude">Exclude</h3>

This command will add files to the repositories [exclude file](https://help.github.com/en/articles/ignoring-files#explicit-repository-excludes).  Files listed in the exclude file are ignored by git locally, but are not ignored outside of your local repository.  This is a great place to put files that you know you will uniquely generate, such as:

- Development Configuration Files
- Debugging Files
- Debugging Logs

To get started run the node-cli tool with the following command:

`update-notes exclude`

This command will check your local git repository for any untracked files:

![exclude_screenshot]()

Using your keyboard (up and down to navigate, and space to select) select the files you wish to exclude.  Once you have selected the files, click Enter to save your changes.

<h3 id="commit">Commit</a>

This command will walk through the commit process and generate a commit message for you with the following format:

```
<type>: <message>
## Git Commit Template v1.0
## Author: Thomas Kottke <admin@tdkottke.com>
## Template supports the logging of information related to the ticket based on multiple git commit template philosophies

# Files committed:
	<list of files to be commited>

# Ticketing System Information
  ticket: <(optional) tracking ticket>

# Commit Summery:
  Why is the change necessary?
    <(optional) description of why the commit>
  How does it address the issue?
    <(optional) description of how the commit>
  What side effects does this change have?
    <(optional) description of possible side effects>
```

To get started, run the note-cli tool with the following command:

`update-notes commit`

Using your keyboard (up and down to navigate, and space to select) select the files you wish to commit.  Once you have selected the files, click Enter to save your changes.

![commit_screenshot1]()

Select a type of commit:

![commit_screenshot2]()

Enter a commit message:

![commit_screenshot3]()

Optionally enter a ticket number if you are using a ticketing system with you project:

![commit_screenshot4]()

Optionally enter a description of why the commit is necessary:

![commit_screenshot5]()

Optionally enter a description of how the commit fixes any issues:

![commit_screenshot6]()

Optionally enter a description of any possible side effects that you think may come as a result of this commit:

![commit_screenshot7]()

The script will generate your commit message and display it for your review:

![commit_screenshot8]()

To confirm your changes enter 'y' and the commit will be submitted