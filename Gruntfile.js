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
            build_admin: ['dist/admin/**', 'docs/<%= pkg.name %>/admin/**'],
            build_front: ['dist/front/**', 'docs/<%= pkg.name %>/front/**'],
            build_gh_pages: ['docs/_dist/**']
        },
        concat: { //files concat
            options: {
                separator: ';'
            },
            buildjs_admin: {
                options: {
                    banner: '<%= meta.banner %>\n<%= meta.jqueryCheck %>'
                },
                files: {
                    'dist/admin/js/<%= pkg.name %>.js': [
                        'src/js/utils.<%= pkg.name %>.js',
                        'src/js/string.<%= pkg.name %>.js',
                        'src/js/base.<%= pkg.name %>.js',
                        'src/js/alert.<%= pkg.name %>.js',
                        'src/js/breadcrumb.<%= pkg.name %>.js',
                        'src/js/chosen.<%= pkg.name %>.js',
                        'src/js/chosen.remote.<%= pkg.name %>.js',
                        'src/js/datetimepicker.<%= pkg.name %>.js',
                        'src/js/datatables.selectrows.<%= pkg.name %>.js',
                        'src/js/datatables.<%= pkg.name %>.js',
                        'src/js/knockout.<%= pkg.name %>.js',
                        'src/js/dropdown.query.<%= pkg.name %>.js',
                        'src/js/dropdown.hover.<%= pkg.name %>.js',
                        'src/js/dropdown.table.<%= pkg.name %>.js',
                        'src/js/dropdown.tree.<%= pkg.name %>.js',
                        'src/js/dropdown.<%= pkg.name %>.js',
                        'src/js/tagsselect.<%= pkg.name %>.js',
                        'src/js/navbar.menu.<%= pkg.name %>.js',
                        'src/js/vertical.menu.<%= pkg.name %>.js',
                        'src/js/sidebar.menu.<%= pkg.name %>.js',
                        'src/js/modalbox.<%= pkg.name %>.js',
                        'src/js/popover.<%= pkg.name %>.js',
                        'src/js/tab.<%= pkg.name %>.js',
                        'src/js/tooltip.<%= pkg.name %>.js',
                        'src/js/form.<%= pkg.name %>.js',
                        'src/js/messagebox.<%= pkg.name %>.js',
                        'src/js/form.<%= pkg.name %>.js'
                    ]
                }
            },
            mergecss_admin: {
                options: {
                    separator: grunt.util.linefeed
                },
                files: {
                    'dist/admin/css/<%= pkg.name %>.css': [
                        'plugins/font-awesome/css/font-awesome.css',
                        'plugins/bootstrapValidator/css/bootstrapValidator.css',
                        'plugins/toastr/css/toastr.css',
                        'plugins/jquery-treetable/css/jquery.treetable.css',
                        'plugins/bootstrap-tagsinput/css/bootstrap-tagsinput.css',
                        'plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.css',
                        'plugins/jstree/css/style.css',
                        'dist/admin/css/<%= pkg.name %>.css'
                    ],
                    'dist/admin/css/<%= pkg.name %>.min.css': [
                        'plugins/font-awesome/css/font-awesome.min.css',
                        'plugins/bootstrapValidator/css/bootstrapValidator.min.css',
                        'plugins/toastr/css/toastr.min.css',
                        'plugins/jquery-treetable/css/jquery.treetable.min.css',
                        'plugins/bootstrap-tagsinput/css/bootstrap-tagsinput.min.css',
                        'plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css',
                        'plugins/jstree/css/style.min.css',
                        'dist/admin/css/<%= pkg.name %>.min.css'
                    ]
                }
            },
            mergejs_admin: {
                options: {
                    separator: grunt.util.linefeed + ";"
                },
                files: {
                    'dist/admin/js/<%= pkg.name %>.js': [
                        'plugins/moment/js/moment-with-locales.js',
                        'plugins/slimScroll/js/slimscroll.js',
                        'plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.js',
                        'plugins/chosen/js/chosen.jquery.js',
                        'plugins/form/js/form.jquery.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.zh_cn.js',
                        'plugins/bootstrap-tagsinput/js/bootstrap-tagsinput.js',
                        'plugins/bootbox/js/bootbox.js',
                        'plugins/toastr/js/toastr.js',
                        'plugins/datatables/js/jquery.dataTables.js',
                        'plugins/datatables/js/dataTables.bootstrap.js',
                        'plugins/jquery-treetable/js/jquery.treetable.js',
                        'plugins/jstree/js/jstree.js',
                        'dist/admin/js/<%= pkg.name %>.js'
                    ],
                    'dist/admin/js/<%= pkg.name %>.min.js': [
                        'plugins/moment/js/moment-with-locales.min.js',
                        'plugins/slimScroll/js/slimscroll.min.js',
                        'plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
                        'plugins/chosen/js/chosen.jquery.min.js',
                        'plugins/form/js/form.jquery.min.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.min.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.zh_cn.min.js',
                        'plugins/bootstrap-tagsinput/js/bootstrap-tagsinput.min.js',
                        'plugins/bootbox/js/bootbox.min.js',
                        'plugins/toastr/js/toastr.min.js',
                        'plugins/datatables/js/jquery.dataTables.min.js',
                        'plugins/datatables/js/dataTables.bootstrap.min.js',
                        'plugins/jquery-treetable/js/jquery.treetable.min.js',
                        'plugins/jstree/js/jstree.min.js',
                        'dist/admin/js/<%= pkg.name %>.min.js'
                    ]
                }
            },
            buildjs_front: {
                options: {
                    banner: '<%= meta.banner %>\n<%= meta.jqueryCheck %>'
                },
                files: {
                    'dist/front/js/<%= pkg.name %>.js': [
                        'src/js/utils.<%= pkg.name %>.js',
                        'src/js/string.<%= pkg.name %>.js',
                        'src/js/base.<%= pkg.name %>.js',
                        'src/js/chosen.<%= pkg.name %>.js',
                        'src/js/chosen.remote.<%= pkg.name %>.js',
                        'src/js/dropdown.hover.<%= pkg.name %>.js',
                        'src/js/dropdown.<%= pkg.name %>.js',
                        'src/js/navbar.menu.<%= pkg.name %>.js',
                        'src/js/vertival.menu.<%= pkg.name %>.js',
                        'src/js/popover.<%= pkg.name %>.js',
                        'src/js/tab.<%= pkg.name %>.js',
                        'src/js/tooltip.<%= pkg.name %>.js',
                        'src/js/form.<%= pkg.name %>.js'
                    ]
                }
            },
            mergecss_front: {
                options: {
                    separator: grunt.util.linefeed
                },
                files: {
                    'dist/front/css/<%= pkg.name %>.css': [
                        'plugins/font-awesome/css/font-awesome.css',
                        'plugins/bootstrapValidator/css/bootstrapValidator.css',
                        'dist/front/css/<%= pkg.name %>.css'
                    ],
                    'dist/front/css/<%= pkg.name %>.min.css': [
                        'plugins/font-awesome/css/font-awesome.min.css',
                        'plugins/bootstrapValidator/css/bootstrapValidator.min.css',
                        'dist/front/css/<%= pkg.name %>.min.css'
                    ]
                }
            },
            mergejs_front: {
                options: {
                    separator: grunt.util.linefeed + ";"
                },
                files: {
                    'dist/front/js/<%= pkg.name %>.js': [
                        'plugins/chosen/js/chosen.jquery.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.zh_cn.js',
                        'plugins/form/js/form.jquery.js',
                        'dist/front/js/<%= pkg.name %>.js'
                    ],
                    'dist/front/js/<%= pkg.name %>.min.js': [
                        'plugins/chosen/js/chosen.jquery.min.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.min.js',
                        'plugins/bootstrapValidator/js/bootstrapValidator.zh_cn.min.js',
                        'plugins/form/js/form.jquery.min.js',
                        'dist/front/js/<%= pkg.name %>.min.js'
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
                    'dist/admin/js/<%= pkg.name %>.min.js': ['dist/admin/js/<%= pkg.name %>.js'],
                    'dist/front/js/<%= pkg.name %>.min.js': ['dist/front/js/<%= pkg.name %>.js']
                }
            },
            minify_plugins: {
                options: {
                    preserveComments: 'some'
                },
                files: {
                    'plugins/jquery-treetable/js/jquery.treetable.min.js': ['plugins/jquery-treetable/js/jquery.treetable.js'],
                    'plugins/datatables/js/dataTables.bootstrap.min.js': ['plugins/datatables/js/dataTables.bootstrap.js'],
                    'plugins/bootstrapvalidator/js/bootstrapValidator.min.js': ['plugins/bootstrapvalidator/js/bootstrapValidator.js'],
                    'plugins/bootstrapvalidator/js/bootstrapValidator.zh_cn.min.js': ['plugins/bootstrapvalidator/js/bootstrapValidator.zh_cn.js'],
                    'plugins/bootbox/js/bootbox.min.js': ['plugins/bootbox/js/bootbox.js'],
                    'plugins/jstree/js/jstree.min.js': ['plugins/jstree/js/jstree.js'],
                    'plugins/moment/js/moment-with-locales.min.js': ['plugins/moment/js/moment-with-locales.js'],
                    'plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js': ['plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.js'],
                    'plugins/form/js/form.jquery.min.js': ['plugins/form/js/form.jquery.js']
                }
            },
            minify_doc:{
                files:{
                    'docs/assets/js/test.min.js': ['docs/assets/js/test.js']
                }
            }
        },
        less: { //convert less to css
            build_admin: {
                options: {
                    banner: '<%= meta.banner %>',
                    strictMath: true
                },
                files: {
                    'dist/admin/css/<%= pkg.name %>.css': 'src/css/<%= pkg.name %>-admin.less'
                }
            },
            build_front: {
                options: {
                    banner: '<%= meta.banner %>',
                    strictMath: true
                },
                files: {
                    'dist/front/css/<%= pkg.name %>.css': 'src/css/<%= pkg.name %>-front.less'
                }
            },
            build_admintheme: {
                options: {
                    banner: '<%= meta.banner %>',
                    strictMath: true
                },
                files: [{
                    expand: true,
                    cwd: 'src/css/themes/',
                    src: ['*.less', '!themes-mixins.less'],
                    dest: 'dist/admin/css',
                    ext: '.css'
                }]
            }
        },
        cssmin: { //css compress
            minify_admin: {
                expand: true,
                cwd: 'dist/admin/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/admin/css/',
                ext: '.min.css'
            },
            minify_front: {
                expand: true,
                cwd: 'dist/front/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/front/css/',
                ext: '.min.css'
            },
            minify_plugins: {
                files: {
                    'plugins/jquery-treetable/css/jquery.treetable.min.css': ['plugins/jquery-treetable/css/jquery.treetable.css'],
                    'plugins/bootstrapvalidator/css/bootstrapValidator.min.css': ['plugins/bootstrapvalidator/css/bootstrapValidator.css'],
                    'plugins/bootstrap-tagsinput/css/bootstrap-tagsinput.min.css': ['plugins/bootstrap-tagsinput/css/bootstrap-tagsinput.css'],
                    'plugins/toastr/css/toastr.min.css': ['plugins/toastr/css/toastr.css'],
                    'plugins/jstree/css/style.min.css': ['plugins/jstree/css/style.css']
                }
            }
        },
        csscomb: {
          options: {
            config: 'src/css/.csscomb.json'
          },
          admin: {
            files: [{
                expand: true,
                cwd: 'dist/admin/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/admin/css/',
                ext: '.css'
            }]
          },
          front: {
            files: {
              'dist/front/css/<%= pkg.name %>.css': 'dist/front/css/<%= pkg.name %>.css'
            }
          }
        },
        compress: {
            build: {
              options: {
                mode: 'gzip'
              },
              files: [
                // Each of the files in the src/ folder will be output to
                // the dist/ folder each with the extension .gz.js
                {expand: true, src: ['dist/*/js/*.min.js'], dest: '.', ext: '.min.js.gz'},
                {expand: true, src: ['dist/*/css/*.min.css'], dest: '.', ext: '.min.css.gz'}
              ]
            }
        },
        copy: { //copy files to dist
            build_admin: {
                files: [{
                    expand: true,
                    cwd: 'plugins/font-awesome/',
                    src: ['fonts/*'],
                    dest: 'dist/admin/'
                },{
                    expand: true,
                    cwd: 'plugins/jstree/',
                    src: ['img/*'],
                    dest: 'dist/admin/'
                }]
            },
            build_front:{
                files: [{
                    expand: true,
                    cwd: 'plugins/font-awesome/',
                    src: ['fonts/*'],
                    dest: 'dist/front/'
                },{
                    expand: true,
                    cwd: 'plugins/jstree/',
                    src: ['img/*'],
                    dest: 'dist/front/'
                }]
            },
            build_docs: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: 'docs/<%= pkg.name %>/'
                }]
            },
            build_gh_pages: {
                files: [{
                    expand: true,
                    cwd: 'docs/',
                    src: ['**','!_*/**'],
                    dest: 'docs/_dist'
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
        focus: {
            admin: {
                exclude: ['livereload_front']
            },
            front: {
                exclude: ['livereload_admin']
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
            livereload_admin: {
                options: {
                    livereload: '<%= connect.options.livereload %>' // this port must be same with the connect livereload port
                },
                // Watch whatever files you needed.
                files: [
                    'src/css/**/*.less',
                    'src/js/**/*.js',
                    '!src/css/style-<%= pkg.name %>-front.less'
                ],
                tasks: ['admin']
            },
            livereload_front: {
                options: {
                    livereload: '<%= connect.options.livereload %>' // this port must be same with the connect livereload port
                },
                // Watch whatever files you needed.
                files: [
                    'src/css/**/*.less',
                    'src/js/**/*.js',
                    '!src/css/style-<%= pkg.name %>-admin.less'
                ],
                tasks: ['front']
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
        },
        'gh-pages': {
            options: {
              base: 'docs/_dist',
              repo:'https://github.com/macula-projects/mower.git'
            },
            src: '**/*'
        }
    });

    //load grunt plugin task
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-csscomb');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-bowercopy');
    grunt.loadNpmTasks('grunt-focus');
    grunt.loadNpmTasks('grunt-gh-pages');

    // Creates the 'server' task
    grunt.registerTask('svradmin', ['connect:all', 'focus:admin']);

    grunt.registerTask('svrfront', ['connect:all', 'focus:front']);

    // grunt admin
    grunt.registerTask('admin', ['clean:build_admin', 'less:build_admin','less:build_admintheme', 'csscomb:admin', 'concat:buildjs_admin', 'uglify:minify', 'cssmin:minify_admin', 'concat:mergecss_admin', 'concat:mergejs_admin', 'copy:build_admin','copy:build_docs']);
    
    // grunt front
    grunt.registerTask('front', ['clean:build_front', 'less:build_front',  'concat:buildjs_front', 'csscomb:front', 'uglify:minify', 'cssmin:minify_front', 'concat:mergecss_front', 'concat:mergejs_front', 'copy:build_front','copy:build_docs']);

    // grunt release admin
    grunt.registerTask('admin-compress', ['admin','compress']);

    grunt.registerTask('front-compress', ['front','compress']);

    // grunt
    grunt.registerTask('default', ['svradmin']);

    grunt.registerTask('docs', ['clean:build_gh_pages','copy:build_gh_pages','gh-pages']);

    //copy bower files to libs or anywhere
    //grunt.registerTask('init', ['bowercopy']);

};
