module.exports = function (grunt) {
  grunt.initConfig({
    sass: {
      development: {
        files: {
          'css/style.css': 'scss/index.scss'
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']
      },
      dist: {
        expand: true,
        flatten: true,
        src: ['css/*.css'],
        dest: 'css/'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-autoprefixer');

  grunt.registerTask('styles', ['sass', 'autoprefixer']);
  grunt.registerTask('default', ['sass', 'autoprefixer']);
};
