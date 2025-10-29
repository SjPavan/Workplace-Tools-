import app from './app.js';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Research assist services listening on port ${port}`);
});
