import { run as runProactiveTests } from "./proactiveEngine.test.js";

async function main() {
  try {
    await runProactiveTests();
    console.log("All tests passed");
  } catch (error) {
    console.error("Tests failed:\n", error);
    process.exitCode = 1;
  }
}

main();
