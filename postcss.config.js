export default {
  plugins: {
    'postcss-preset-env': {
      browsers: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'Chrome >= 70',
        'Firefox >= 65',
        'Safari >= 13',
        'Edge >= 79'
      ],
      preserve: true
    },
    cssnano: {
      preset: ['default', {
        discardUnused: {
          fontFace: false,
          keyframes: false,
          namespace: false,
          selectors: false,
          stylesheet: false
        },
        reduceIdents: false,
        mergeIdents: false,
        autoprefixer: false
      }]
    }
  }
}