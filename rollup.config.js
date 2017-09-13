import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';


const banner = `/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 **/
`;

export default {
  input: 'lib/index.js',
  name: 'Modal',
  output: {
    file: 'dist/modal.js',
    format: 'umd',
    banner,
    indent: '  '
  },
  plugins: [
    replace({
      'Array.from': 'Array.prototype.slice.call'
    }),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
