// Gruntfile.js

module.exports = function(grunt) {

  require("load-grunt-tasks")(grunt); 

  grunt.initConfig({

    // get the configuration info from package.json
    pkg: grunt.file.readJSON('package.json'),

    // copy all files through first, below commands will then change whatever
    // needs to be changed
    copy: {
      dest: {
        expand: true,
        cwd: 'src',
        src: ['**'],
        dest: 'dest/'
      }
    },

    // html minification
    htmlmin: {
      dest: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {                         
          'dest/index.html': 'src/index.html'
        }
      }
    },

    // javascript transpilation and minification (options in .babelrc file)
    babel: { 
      options: {
        sourceMap: false
      },
      dest: {
		files: [
          {
            expand: true,
            cwd: 'src/js',
            src: ['*.js'],
            dest: 'dest/js'
          }
        ]
      },
      libraries: {
        files: [
          {
            'dest/js/libs/OrbitControls.js': 'src/js/libs/OrbitControls.js',
            'dest/js/libs/Tween.js': 'src/js/libs/Tween.js'
          }
        ]
      }
    },

	// minify css files
	cssmin: {
      options: {
        roundingPrecision: -1
      },
      dest: {
        files: {
          'dest/css/style.css': 'src/css/style.css'
        }
      }
    },


    // lint all js files
    jshint: {
      options: {
        reporter: require('jshint-stylish')
      },
      build: ['Gruntfile.js', 'src/**/*.js']
    }

  });

  // by default: copy all files, then minify html, javascript and then css
  grunt.registerTask('default', ['copy', 'htmlmin', 'babel', 'cssmin']);

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-uglify'); // not used
  grunt.loadNpmTasks('grunt-contrib-less');   // not used
  grunt.loadNpmTasks('grunt-contrib-watch');  // not used
};
