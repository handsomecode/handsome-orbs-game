module.exports = function (grunt) {
  grunt.initConfig({
    less: {
      development: {
        files: {
          'css/style.css': 'less/index.less'
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

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-autoprefixer');

  grunt.registerTask('styles', ['less', 'autoprefixer']);
  grunt.registerTask('default', ['less', 'autoprefixer']);
};
