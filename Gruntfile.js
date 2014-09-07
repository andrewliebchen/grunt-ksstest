/*
 * grunt-ksstest
 * https://github.com/andrewliebchen/grunt-ksstest
 *
 * Copyright (c) 2014 Andrew Liebchen
 * Licensed under the MIT license.
 */

'use strict';
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/phantomcss.js',
                'phantomjs/runner.js',
                '<%= nodeunit.tests %>',
            ],
            options: {
                jshintrc: '.jshintrc',
            },
        },

        // Before generating any new files, remove any
        // previously-created files.
        clean: {
            tests: ['tmp'],
            results: ['results'],
        },

        // Configuration to be run (and then tested).
        ksstest: {
            visualTest: {
                options: {
                    screenshots: 'fixtures/screenshots/',
                    results: 'results/'
                },
                src: [
                    'fixtures/coffeemachine_test.js'
                ]
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js'],
        },
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Whenever the "test" task is run, first clean the "tmp" dir,
    // then run this plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'ksstest', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);
};
