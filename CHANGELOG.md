# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - Unreleased

- ✨ change the way of getting the task id by thread name to get it by a database

## [2.0.2] - Mar 28, 2024

- ✨ more than one thread for the same task cannot be created

## [2.0.1] - Mar 25, 2024

- ✨ when a thread is created by the slash command task a message containing the task url is set.

## [2.0.0] - Mar 21, 2024

- ✨ slash command /task has been changed to post messages to clickup only when a user indicates

## [1.4.0] - Jul 27, 2023

- 🚚 change the endpoint names to differentiate the notion and clickup apis

## [1.3.1] - Jul 26, 2023

- 🚀 fix problems with application deployment

## [1.3.0] - Jul 25, 2023

- ✨ change the clickup bot to retrieve user information through their ids

## [1.2.0] - Jan 23, 2023

- ✨ add url of the images attached to the message posted on discord to be published in the clickup

## [1.1.3] - Jan 13, 2023

- 🐛 add 100 character limit to thread name

## [1.1.2] - Jan 10, 2023

- 🐛 fix bug where thread message collectors are lost after bot service restart

## [1.1.1] - Jan 09, 2023

- 🐛 fix bug when using the slash command task inside a discord topic

## [1.1.0] - Jan 06, 2023

- 👷 add ci file for automatic publish and deploy

## [1.0.2] - Dec 28, 2022

- 🐛 fix bug where all messages posted by the /task command are posted by the author of the command

## [1.0.1] - Dec 28, 2022

### Updated

- 🔊 add logs on task slash command
- ♻️ refactor usernames and api token mapping

## [1.0.0] - Dec 27, 2022

### Added

- ✨ add slash command to post comments on clickup tasks
- ✨ initial release
