const { app, morningJob } = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Personal productivity API listening on port ${PORT}`);
  morningJob.start();
});
