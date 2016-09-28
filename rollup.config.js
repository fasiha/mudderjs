import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry : 'index.js',
  format : 'umd',
  plugins :
    [ nodeResolve({jsnext : true, main : true}), commonjs({}), babel() ],
  moduleName : 'mudder',
  dest : './dist/mudder.js',
  sourceMap : true,
  sourceMapFile : 'dist/mudder.js.map',
};
