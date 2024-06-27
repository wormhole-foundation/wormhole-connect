const ts = require("typescript");
const fs = require("fs");
const path = require("path");

// searching for imports coming from packages/pathcs matching any of these:
const matchers = ["@certusone"];
//const matchers = ["@wormhole-foundation/wormhole-connect-sdk"];

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // If the file is a directory, recurse into it
      walkDirectory(filePath, fileList);
    } else if (stat.isFile()) {
      // If the file is a regular file, add it to the list
      fileList.push(filePath);
    }
  });

  return fileList;
}

function collectImports(filePath) {
  if (filePath.includes("node_modules")) return [];

  const fileContent = fs.readFileSync(filePath, "utf8");

  // Create a SourceFile object representing the file
  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    fileContent,
    ts.ScriptTarget.Latest, // Language version
    true // SetParentNodes
  );

  const imports = [];

  // Visitor function to collect imports
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.getText().slice(1, -1); // Remove the quotes
      const importClause = node.importClause;

      if (importClause) {
        const importDetails = {
          filePath,
          from: moduleSpecifier,
          namedImports: [],
          defaultImport: null,
          namespaceImport: null,
        };

        if (importClause.name) {
          // Default import
          importDetails.defaultImport = importClause.name.getText();
        }

        if (importClause.namedBindings) {
          if (ts.isNamespaceImport(importClause.namedBindings)) {
            // Namespace import
            importDetails.namespaceImport =
              importClause.namedBindings.name.getText();
          } else if (ts.isNamedImports(importClause.namedBindings)) {
            // Named imports
            importClause.namedBindings.elements.forEach((element) => {
              const importName = element.name.getText();
              const propertyName = element.propertyName
                ? element.propertyName.getText()
                : null;
              importDetails.namedImports.push({
                name: importName,
                alias: propertyName,
              });
            });
          }
        }

        imports.push(importDetails);
      }
    }
    ts.forEachChild(node, visit);
  }

  // Start AST traversal
  visit(sourceFile);

  return imports;
}

const files = walkDirectory(process.argv[2]);

var counts = {};
var filePaths = {};

for (let fp of files) {
  const imports = collectImports(fp);
  const sdkImports = imports.filter((val) => {
    for (let m of matchers) {
      if (val.from.includes(m)) return true;
    }
    return false;
  });
  if (sdkImports.length > 0) {
    //console.log(fp);
    //console.log(sdkImports);

    for (let im of sdkImports) {
      for (let ni of im.namedImports) {
        const key = `${ni.name} ${im.from}`;
        counts[key] = counts[key] ? counts[key] + 1 : 1;
        filePaths[key] = filePaths[key] ? [fp].concat(filePaths[key]) : [fp];
      }
    }
  }
}

var sorted = [];

for (let key of Object.keys(counts)) {
  sorted.push([key, counts[key]]);
}

sorted.sort((a, b) => a[1] - b[1]);

let sum = 0;
let unique = 0;

for (let entry of sorted) {
  console.log(entry[0], entry[1]);
  sum += entry[1];
  unique += 1;

  for (let fp of filePaths[entry[0]]) {
    console.log("  " + fp);
  }
}

console.log("total", sum);
console.log("unique", unique);
