import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";

// Directory to scan for TypeScript files
const targetDirectory = path.resolve("sdk");

// Function to recursively find all .ts files in the directory
function findAllTsFiles(dir: string, filelist: string[] = []): string[] {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findAllTsFiles(filePath, filelist);
    } else if (filePath.endsWith(".ts") && !filePath.endsWith(".d.ts")) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

// Function to extract named exports from a TypeScript file
function extractExports(filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );

  const exports: string[] = [];
  const identifiers = {};

  function visit(node: ts.Node) {
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      node.exportClause.elements.forEach((element) => {
        exports.push(element.name.text);
      });
    } else if (
      ts.isExportAssignment(node) &&
      ts.isIdentifier(node.expression)
    ) {
      exports.push(node.expression.text);
    } else if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      node.declarationList.declarations.forEach((declaration) => {
        if (ts.isIdentifier(declaration.name)) {
          exports.push(declaration.name.text);
        }
      });
    } else if (
      ts.isFunctionDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.name) {
        exports.push(node.name.text);
      }
    } else if (
      ts.isClassDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.name) {
        exports.push(node.name.text);
      }
    } else if (ts.isIdentifier(node)) {
      if (node.getText()) {
        let n = node.getText();
        if (identifiers[n] === undefined) identifiers[n] = 0;
        identifiers[n] += 1;
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  const exportsNotUsedLocally = exports.filter((name) => {
    return identifiers[name] <= 1;
  });

  //console.log(filePath, exportsNotUsedLocally);

  //console.log(exports.length, exportsNotUsedLocally.length);

  return exportsNotUsedLocally;
}

// Collect all .ts files in the target directory
const tsFiles = findAllTsFiles(targetDirectory);

// Extract and print all named exports
const allExports: string[] = [];
tsFiles.forEach((file) => {
  const fileExports = extractExports(file);
  allExports.push({ file, fileExports });
});

//console.log('Named exports found:');
//allExports.forEach(({ file, fileExports }) => console.log(file, fileExports));

// STEP 2

// searching for imports coming from packages/pathcs matching any of these:
const matchers = ["@wormhole-foundation/wormhole-connect-sdk"];

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
  const fileContent = fs.readFileSync(filePath, "utf8");

  // Create a SourceFile object representing the file
  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    fileContent,
    ts.ScriptTarget.Latest, // Language version
    true // SetParentNodes
  );

  const imports = [];
  const identifiers = [];

  // Visitor function to collect imports
  function visit(node) {
    if (ts.isIdentifier(node)) {
      identifiers.push(node.getText());
    }
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

  return { imports, identifiers };
}

const files = walkDirectory("wormhole-connect/src").concat(
  walkDirectory("sdk/src")
);

const usedImports = new Set();

for (let fp of files) {
  const { imports, identifiers } = collectImports(fp);

  console.log(fp, imports, identifiers.length);

  const sdkImports = imports.filter((val) => {
    for (let m of matchers) {
      if (val.from.includes(m)) return true;
      if (val.from.includes("../")) return true;
      if (val.from.includes("./")) return true;
    }
    return false;
  });
  if (sdkImports.length > 0) {
    for (let im of sdkImports) {
      for (let ni of im.namedImports) {
        usedImports.add(ni.name);
      }
    }
  }
}

const unusedExports = [];

for (let { file, fileExports } of allExports) {
  for (let item of fileExports) {
    if (usedImports.has(item)) {
    } else {
      unusedExports.push({ item, file });
    }
  }
}

console.log(`Identified ${unusedExports.length} unused exports`);
for (let { item, file } of unusedExports) {
  console.log(`${item} - ${file}`);
}

// STEP 3

// Function to extract and remove specified exports from a TypeScript file
function removeExports(filePath: string, exportsToRemove: string[]): string {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );

  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (
    context
  ) => {
    const visit: ts.Visitor = (node) => {
      if (
        (ts.isExportDeclaration(node) &&
          node.exportClause &&
          ts.isNamedExports(node.exportClause) &&
          node.exportClause.elements.some((el) =>
            exportsToRemove.includes(el.name.text)
          )) ||
        (ts.isExportAssignment(node) &&
          ts.isIdentifier(node.expression) &&
          exportsToRemove.includes(node.expression.text)) ||
        (ts.isVariableStatement(node) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
          node.declarationList.declarations.some(
            (declaration) =>
              ts.isIdentifier(declaration.name) &&
              exportsToRemove.includes(declaration.name.text)
          )) ||
        (ts.isFunctionDeclaration(node) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
          node.name &&
          exportsToRemove.includes(node.name.text)) ||
        (ts.isClassDeclaration(node) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
          node.name &&
          exportsToRemove.includes(node.name.text))
      ) {
        return undefined; // Remove the node
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (node) => ts.visitNode(node, visit);
  };

  const result = ts.transform(sourceFile, [transformerFactory]);
  const printer = ts.createPrinter();
  const transformedSourceFile = result.transformed[0] as ts.SourceFile;
  const newContent = printer.printFile(transformedSourceFile);

  const formattedContent = prettier.format(newContent, {
    parser: "typescript",
    tabWidth: 2,
    singleQuote: true,
    trailingComma: "all",
    semi: true,
  });

  console.log(`Writing ${filePath}`);
  fs.writeFileSync(filePath, formattedContent, "utf8");
}

for (let { item, file } of unusedExports) {
  removeExports(file, [item]);
}
