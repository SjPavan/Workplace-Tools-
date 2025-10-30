function lintJavaScript(code) {
  const issues = [];
  let fixed = code;

  const varMatches = code.match(/var\s+\w+/g);
  if (varMatches) {
    issues.push({
      message: 'Avoid using var, prefer const or let.',
      severity: 'warning'
    });
    fixed = fixed.replace(/var\s+/g, 'const ');
  }

  const consoleWithoutSemicolon = code.match(/console\.log\([^;\n]+\)\s*\n/g);
  if (consoleWithoutSemicolon) {
    issues.push({
      message: 'Add a semicolon after console.log statements.',
      severity: 'info'
    });
    fixed = fixed.replace(/console\.log\(([^;\n]+)\)\s*\n/g, 'console.log($1);\n');
  }

  return { issues, fixedCode: fixed };
}

function lintPython(code) {
  const issues = [];
  let fixed = code;

  if (/\t/.test(code)) {
    issues.push({
      message: 'Avoid tabs in Python, use 4 spaces instead.',
      severity: 'warning'
    });
    fixed = fixed.replace(/\t/g, '    ');
  }

  const printMatches = code.match(/print\s+"/g);
  if (printMatches) {
    issues.push({
      message: 'Use parentheses in print statements (Python 3).',
      severity: 'error'
    });
    fixed = fixed.replace(/print\s+"([^"]+)"/g, 'print("$1")');
  }

  return { issues, fixedCode: fixed };
}

function lintGeneric(code) {
  const issues = [];
  let fixed = code;

  const trailingSpacesRegex = /[\t ]+$/gm;
  if (trailingSpacesRegex.test(code)) {
    issues.push({
      message: 'Remove trailing whitespace.',
      severity: 'info'
    });
    fixed = fixed.replace(trailingSpacesRegex, '');
  }

  return { issues, fixedCode: fixed };
}

function lintCode(language, code) {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return lintJavaScript(code);
    case 'python':
      return lintPython(code);
    default:
      return lintGeneric(code);
  }
}

module.exports = {
  lintCode
};
