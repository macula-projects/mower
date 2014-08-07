/*!
 * mower's Gruntfile
 * http://www.infinitus.com.cn/
 * Copyright (c) 2014 Infinitus, Inc.
 * Licensed under MIT (https://github.com/macula-projects/mower/blob/master/LICENSE-MIT)
 */

module.exports = function(grunt) {

    'use strict';

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*!\n' +
                ' * <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                ' * Licensed under <%= _.pluck(pkg.licenses, "type").join(", ") %> (<%= _.pluck(pkg.licenses, "url").join(", ") %>)\n' +
                ' */\n',
            jqueryCheck: 'if (typeof jQuery === \'undefined\') { throw new Error(\'Mower\\\'s JavaScript requires jQuery\') }\n\n',
            build_date: '<%= grunt.template.today("yyyymmddHHMMss") %>',
            build_num: process.env.BUILD_NUMBER || 0, // Jenkins build number if available
            version_string: '<%= pkg.version %>-<%= meta.build_num %>'
        },
        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                hostname: 'localhost', // Change this to '0.0.0.0' to access the server from outside.
                livereload: 35729
            },
            all: {
                options: {
                    open: true,
                    base: [
                        'dist' // This is the base file folder. we suppose our index.html is located in this folder
                    ]
                }
            }
        },
        // Task configuration
        clean: { // clean all
            development: ['dist/css', 'dist/js'],
            production: ['dist/**']
        },
        concat: { //files concat
            options: {
                banner: '<%= meta.banner %>',
                stripBanners: false,
                separator: ';'
            },
            buildcss: {
                files: {
                    'dist/css/<%= pkg.name %>-modules.css': ['src/css/modules/**/*.css', '!**/*.min.css']
                }
            },
            buildjs: {
                options: {
                    banner: '<%= meta.banner %>\n<%= meta.jqueryCheck %>'
                },
                files: {
                    'dist/js/<%= pkg.name %>.js': [
                        'src/js/base.mower.js',
                        'src/js/utils.mower.js',
                        'src/js/breadcrumb.mower.js',
                        'src/js/datatables.mower.js',
                        'src/js/dropdown.hover.mower.js',
                        'src/js/dropdown.mower.js',
                        'src/js/magnifier.mower.js',
                        'src/js/menu.mower.js',
                        'src/js/modal.mower.js',
                        'src/js/popover.mower.js',
                        'src/js/tab.mower.js',
                        'src/js/tooltip.mower.js',
                        'src/js/utils.mower.js',
                        'src/js/validator.mower.js'
                    ]
                }
            }
        },
        uglify: { //js compress
            minify: {
                options: {
                    banner: '<%= meta.banner %>'
                },
                files: {
                    'dist/js/<%= pkg.name %>.min.js': ['dist/js/<%= pkg.name %>.js']
                }
            }
        },
        less: { //convert less to css
            buildcore: {
                options: {
                    strictMath: true
                },
                files: {
                    'dist/css/<%= pkg.name %>.css': 'src/css/mower.less'
                }
            },
            buildtheme: {
                options: {
                    strictMath: true
                },
                files: {
                    'dist/css/<%= pkg.name %>-theme.css': 'src/css/themes/theme.less'
                }
            }
        },
        cssmin: { //css compress
            options: {
                banner: '<%= meta.banner %>'
            },
            minify: {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/css/',
                ext: '.min.css'
            }
        },
        usebanner: { //set banner in the files
            build: {
                options: {
                    position: 'top',
                    banner: '<%= meta.banner %>'
                },
                files: {
                    src: [
                        'dist/css/<%= pkg.name %>.css',
                        'dist/css/<%= pkg.name %>-theme.css'
                    ]
                }
            }
        },
        compress: {
            build: {
                options: {
                    archive: 'mower_' + '<%= meta.version_string %>_<%= meta.build_date %>' + '.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: 'dist/'
                }]
            }
        },
        copy: { //copy files to dist
            build: {
                files: [
                    // includes files within path and its sub-directories
                    {
                        expand: true,
                        src: ['libs/**'],
                        dest: 'dist/'
                    },

                    {
                        expand: true,
                        src: ['plugins/**'],
                        dest: 'dist/'
                    },

                    // includes files within path
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['images/*'],
                        dest: 'dist/'
                    },

                    // includes files within path and its sub-directories
                    {
                        expand: true,
                        src: ['docs/**'],
                        dest: 'dist/'
                    },

                    // includes files within path and its sub-directories
                    {
                        expand: true,
                        src: ['samples/**'],
                        dest: 'dist/'
                    }
                ]
            }
        },
        jshint: { //file validate,non activated in task
            gruntfile: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: 'Gruntfile.js'
            },
            src: {
                options: {
                    jshintrc: 'src/js/.jshintrc'
                },
                src: ['src/js/**/*.js']
            }
        },
        watch: { //recompile watching on file change
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            src: {
                files: '<%= jshint.src.src %>',
                tasks: ['jshint:src']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>' // this port must be same with the connect livereload port
                },
                // Watch whatever files you needed.
                files: [
                    'src/css/**/*.less',
                    'src/js/**/*.js'
                ],
                tasks: ['dev']
            }
        },
        bowercopy: {
            options: {
                srcPrefix: 'bower_components'
                //clean: false // default false
            },
            libs: {
                options: {
                    destPrefix: 'libs/'
                },
                files: {
                    'jquery/jquery.js': 'jquery/dist/jquery.js'
                }
            }
        }
    });

    //load grunt plugin task
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-bowercopy');


    // Creates the 'serve' task
    grunt.registerTask('serve', ['connect:all', 'watch']);

    // grunt dev
    grunt.registerTask('dev', ['clean:development', 'less', 'concat', 'uglify', 'cssmin', 'usebanner']);

    // grunt release
    grunt.registerTask('pro', ['clean:production', 'less', 'concat', 'uglify', 'cssmin', 'usebanner', 'copy', 'compress']);

    // grunt
    grunt.registerTask('default', ['dev']);

    //copy bower files to libs or anywhere
    //grunt.registerTask('init', ['bowercopy']);

};
