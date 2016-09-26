import npm from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry : 'index.js',
  format : 'umd',
  plugins : [
    npm({
      jsnext : true,
      browser : true,
    }),
    commonjs({ignoreGlobal : true}), babel()
  ],
  moduleName : 'mudder',
  dest : './dist/mudder.js',
  sourceMap : true,
  sourceMapFile : 'dist/mudder.js.map',
};

