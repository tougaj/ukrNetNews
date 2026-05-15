module.exports = {
  apps: [
    {
      name: 'ukrNetLoader',

      script: 'node',
      args: 'dist/ptLoader.js -l',

      time: true,

      restart_delay: 300000,

      kill_timeout: 240000,
    },
  ],
};
