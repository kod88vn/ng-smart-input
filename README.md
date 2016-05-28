![Alt text](/sample.png?raw=true)
# ng-smart-input
## Introduction
Fancy performance input box with autocomplete

## Installing
* `npm install -g gulp gulp-cli` install global cli dependencies
* `npm install` to install dependencies

## Usage
* `<script type='text/javascript' src='ng-smart-input/dist/app.min.js'></script>`
* `angular.module('myApp', ['ng-smart-input'])`
* provide a config object

## Config Options
* id: give your input a unique id (mandatory)
* placeholders: list of texts to be displayed as placeholder (optional)
* delay: wait time until suggestions appear (optional)
* suggestions: search space

## Config Example
```javascript
this.smartInputConfig = {
	id: 'fancy-input',
	placeholders: [
		'fancy smart input...',
		'your search text goes here'
	],
	delay: 500,
	suggestions: [
		'angular', 
		'angoala', 
		'kola', 
		'ant', 
		'angry',
		'anthem',
		'apple',
		'ak',
		'car',
		'arse',
		'anker',
		'antler',
		'obama',
		'omaha',
		'alabama'
	]
};
```
