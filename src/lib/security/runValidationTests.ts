import { runValidationTestCases } from "@/lib/security/validateAnalysisInput.test";

const results = runValidationTestCases();
const failed = results.filter((result) => !result.passed);

for (const result of results) {
  const marker = result.passed ? "PASS" : "FAIL";
  console.log(`${marker} ${result.name}`);

  if (!result.passed) {
    console.log(`  expected valid: ${result.expectedValid}`);
    console.log(`  actual valid:   ${result.actualValid}`);
    if (result.errors.length > 0) {
      console.log("  errors:");
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }
  }
}

console.log("");
console.log(`Validation tests: ${results.length - failed.length}/${results.length} passed`);

if (failed.length > 0) {
  process.exitCode = 1;
}
