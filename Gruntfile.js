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
            jqueryCheck: 'if (typeof jQuery === \'undefined\') { throw new Error(\'<%= pkg.name %>\\\'s JavaScript requires jQuery\') }\n\n',
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
                        'docs/' // This is the base file folder. we suppose our index.html is located in this folder
                    ]
                }
            }
        },
        // Task configuration
        clean: { // clean all
            build: ['dist/**', 'docs/<%= pkg.name %>/**']
        },
        concat: { //files concat
            options: {
                separator: ';'
            },
            buildcss: {
                options: {
                    banner: '<%= meta.banner %>'
                },
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
                        'src/js/base.<%= pkg.name %>.js',
                        'src/js/utils.<%= pkg.name %>.js',
                        'src/js/breadcrumb.<%= pkg.name %>.js',
                        'src/js/datatables.<%= pkg.name %>.js',
                        'src/js/dropdown.hover.<%= pkg.name %>.js',
                        'src/js/dropdown.<%= pkg.name %>.js',
                        'src/js/magnifier.<%= pkg.name %>.js',
                        'src/js/menu.<%= pkg.name %>.js',
                        'src/js/modal.<%= pkg.name %>.js',
                        'src/js/popover.<%= pkg.name %>.js',
                        'src/js/tab.<%= pkg.name %>.js',
                        'src/js/tooltip.<%= pkg.name %>.js',
                        'src/js/utils.<%= pkg.name %>.js',
                        'src/js/validator.<%= pkg.name %>.js'
                    ]
                }
            },
            mergecss: {
                options: {
                    separator: grunt.util.linefeed
                },
                files: {
                    'dist/css/<%= pkg.name %>.css': [
                        'plugins/font-awesome/css/font-awesome.css',
                        'dist/css/<%= pkg.name %>.css',
                        'plugins/bootstrapValidator/dist/css/bootstrapValidator.css',
                        'plugins/jquery-treetable/stylesheets/jquery.treetable.css'
                    ],
                    'dist/css/<%= pkg.name %>.min.css': [
                        'plugins/font-awesome/css/font-awesome.min.css',
                        'dist/css/<%= pkg.name %>.min.css',
                        'plugins/bootstrapValidator/dist/css/bootstrapValidator.min.css',
                        'plugins/jquery-treetable/stylesheets/jquery.treetable.min.css'
                    ]
                }
            },
            mergejs: {
                options: {
                    separator: grunt.util.linefeed + ";"
                },
                files: {
                    'dist/js/<%= pkg.name %>.js': [
                        'plugins/bootstrapValidator/dist/js/bootstrapValidator.js',
                        'plugins/datatables/media/js/jquery.dataTables.js',
                        'plugins/jquery-treetable/javascripts/src/jquery.treetable.js',
                        'dist/js/<%= pkg.name %>.js'
                    ],
                    'dist/js/<%= pkg.name %>.min.js': [
                        'plugins/bootstrapValidator/dist/js/bootstrapValidator.min.js',
                        'plugins/datatables/media/js/jquery.dataTables.min.js',
                        'plugins/jquery-treetable/javascripts/src/jquery.treetable.min.js',
                        'dist/js/<%= pkg.name %>.min.js'
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
            },
            minify_treetable: {
                options: {
                    preserveComments: 'some'
                },
                files: {
                    'plugins/jquery-treetable/javascripts/src/jquery.treetable.min.js': ['plugins/jquery-treetable/javascripts/src/jquery.treetable.js']
                }
            },
        },
        less: { //convert less to css
            buildcore: {
                options: {
                    banner: '<%= meta.banner %>',
                    strictMath: true
                },
                files: {
                    'dist/css/<%= pkg.name %>.css': 'src/css/<%= pkg.name %>.less'
                }
            },
            buildtheme: {
                options: {
                    banner: '<%= meta.banner %>',
                    strictMath: true
                },
                files: {
                    'dist/css/<%= pkg.name %>-theme.css': 'src/css/themes/theme.less'
                }
            }
        },
        cssmin: { //css compress
            minify: {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/css/',
                ext: '.min.css'
            },
            minify_treetable: {
                files: {
                    'plugins/jquery-treetable/stylesheets/jquery.treetable.min.css': ['plugins/jquery-treetable/stylesheets/jquery.treetable.css']
                }
            },
        },
        compress: {
            build: {
                options: {
                    archive: '<%= pkg.name %>_' + '<%= meta.version_string %>_<%= meta.build_date %>' + '.zip'
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
                files: [{
                    expand: true,
                    cwd: 'plugins/font-awesome/',
                    src: ['fonts/*'],
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: 'docs/<%= pkg.name %>/'
                },{
                    expand: true,
                    cwd: 'plugins/font-awesome/',
                    src: ['fonts/*'],
                    dest: 'docs/<%= pkg.name %>/'
                }]
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


    // Creates the 'server' task
    grunt.registerTask('server', ['connect:all', 'watch']);

    // grunt dev
    grunt.registerTask('dev', ['clean', 'less', 'concat:buildcss', 'concat:buildjs', 'uglify', 'cssmin', 'concat:mergecss', 'concat:mergejs', 'copy']);

    // grunt release
    grunt.registerTask('release', ['compress', 'clean', 'less', 'concat:buildcss', 'concat:buildjs', 'uglify', 'cssmin', 'concat:mergecss', 'concat:mergejs', 'copy']);

    // grunt
    grunt.registerTask('default', ['dev']);

    //copy bower files to libs or anywhere
    //grunt.registerTask('init', ['bowercopy']);

};