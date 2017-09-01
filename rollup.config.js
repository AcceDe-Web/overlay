import babel from 'rollup-plugin-babel';

export default {
  input: 'lib/index.js',
  name: 'Modal',
  output: {
    file: 'dist/modal.js',
    format: 'umd'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
