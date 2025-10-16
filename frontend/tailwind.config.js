module.exports = {
    mode: 'jit',
    // These paths are just examples, customize them to match your project structure
   purge: [
     './public/**/*.html',
     './src/**/*.{js,jsx,ts,tsx,vue}',
     './node_modules/flowbite/**/*.js'],
    plugins: [
        require('flowbite/plugin')
    ]

}