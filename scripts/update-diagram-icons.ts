import { join } from 'node:path';
import { z } from 'astro/zod';
import { file, Glob } from 'bun';
import matter from 'gray-matter';
import {
  type ArrayLiteralExpression,
  type ObjectLiteralExpression,
  Project,
  SyntaxKind,
} from 'ts-morph';
import { ICON_NAMES } from '../src/components/feature/diagram/icon-config';
import {
  type DiagramSection,
  DiagramSectionSchema,
} from '../src/types/diagram-schemas';

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function collectIconsFromDiagrams(
  diagrams: DiagramSection[],
  collection: Set<string>,
): void {
  for (const diagram of diagrams) {
    // 型ガードでプロパティの存在を確認
    if ('icon' in diagram && diagram.icon) {
      collection.add(diagram.icon);
    }

    if ('cards' in diagram && diagram.cards) {
      for (const card of diagram.cards) {
        if ('icon' in card && card.icon) {
          collection.add(card.icon);
        }
      }
    }

    if ('steps' in diagram && diagram.steps) {
      for (const step of diagram.steps) {
        // stepsはListStepItemにはiconがない可能性があるので型ガードで確認
        if (typeof step === 'object' && step !== null && 'icon' in step) {
          const iconValue = step.icon;
          if (typeof iconValue === 'string') {
            collection.add(iconValue);
          }
        }
      }
    }

    if ('comparisons' in diagram && diagram.comparisons) {
      for (const comparison of diagram.comparisons) {
        if ('icon' in comparison && comparison.icon) {
          collection.add(comparison.icon);
        }
      }
    }
  }
}

async function main() {
  console.log('🔍 Scanning markdown files for diagram icons...');

  const usedIcons = new Set<string>();
  const glob = new Glob('contents/blog/**/*.md');
  const Schema = z.array(DiagramSectionSchema);

  for await (const filePath of glob.scan()) {
    const content = await file(filePath).text();
    const { data } = matter(content);

    if (!data.diagram) {
      continue;
    }

    const result = Schema.safeParse(data.diagram);

    if (!result.success) {
      console.warn(`⚠️  Schema validation issues in ${filePath}`);
      // スキーマエラーからもアイコンを抽出(invalid_enum_valueエラーのreceived値)
      for (const issue of result.error.issues) {
        if (
          issue.code === 'invalid_value' &&
          issue.path.join('.').includes('icon') &&
          typeof issue.input === 'string'
        ) {
          console.log(`🔍 Found invalid icon in schema error: ${issue.input}`);
          usedIcons.add(issue.input);
        }
      }
      continue;
    }

    collectIconsFromDiagrams(result.data, usedIcons);
  }

  const currentIcons = new Set<string>(ICON_NAMES);
  const missingIcons = Array.from(usedIcons).filter(
    (icon) => !currentIcons.has(icon),
  );

  if (missingIcons.length === 0) {
    console.log('✅ All icons are already configured.');
    return;
  }

  console.log('🆕 Found missing icons:', missingIcons);

  const configPath = join(
    process.cwd(),
    'src/components/feature/diagram/icon-config.ts',
  );

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(configPath);

  // 1. インポートにアイコンコンポーネントを追加
  const importDeclaration = sourceFile
    .getImportDeclarations()
    .find((imp) => imp.getModuleSpecifierValue() === 'lucide-react');

  if (!importDeclaration) {
    throw new Error('lucide-react import not found');
  }

  const existingImports = importDeclaration
    .getNamedImports()
    .map((imp) => imp.getName());

  const newComponentNames = missingIcons
    .map((icon) => toPascalCase(icon))
    .filter((name) => !existingImports.includes(name));

  for (const componentName of newComponentNames) {
    importDeclaration.addNamedImport(componentName);
  }

  // インポートをアルファベット順にソート
  const allImports = importDeclaration.getNamedImports();
  const sortedImports = allImports
    .map((imp) => ({
      name: imp.getName(),
      alias: imp.getAliasNode()?.getText(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  importDeclaration.removeNamedImports();
  for (const { name, alias } of sortedImports) {
    if (alias) {
      importDeclaration.addNamedImport({ name, alias });
    } else {
      importDeclaration.addNamedImport(name);
    }
  }

  // 2. ICON_NAMES 配列に追加
  const iconNamesVar = sourceFile.getVariableDeclaration('ICON_NAMES');
  if (!iconNamesVar) {
    throw new Error('ICON_NAMES variable not found');
  }

  const initializer = iconNamesVar.getInitializer();
  if (!initializer) {
    throw new Error('ICON_NAMES has no initializer');
  }

  // `as const`があるので AsExpression -> ArrayLiteralExpression
  const iconNamesArray = (
    initializer.getKind() === SyntaxKind.AsExpression
      ? initializer.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression)
      : initializer.getKind() === SyntaxKind.ArrayLiteralExpression
        ? initializer
        : null
  ) as ArrayLiteralExpression | null;

  if (!iconNamesArray) {
    throw new Error('ICON_NAMES is not an array literal');
  }

  const existingIconNames = iconNamesArray
    .getElements()
    .map((el) => el.getText().replace(/['"]/g, ''));

  const newIconNames = missingIcons.filter(
    (icon) => !existingIconNames.includes(icon),
  );

  for (const iconName of newIconNames) {
    iconNamesArray.addElement(`'${iconName}'`);
  }

  // 配列要素をアルファベット順にソート
  const allIconNames = iconNamesArray
    .getElements()
    .map((el) => el.getText().replace(/['"]/g, ''))
    .sort();

  iconNamesArray.removeElement(0);
  while (iconNamesArray.getElements().length > 0) {
    iconNamesArray.removeElement(0);
  }

  for (const iconName of allIconNames) {
    iconNamesArray.addElement(`'${iconName}'`);
  }

  // 3. ICON_MAP オブジェクトに追加
  const iconMapVar = sourceFile.getVariableDeclaration('ICON_MAP');
  if (!iconMapVar) {
    throw new Error('ICON_MAP variable not found');
  }

  const iconMapObject = iconMapVar.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  ) as ObjectLiteralExpression;

  const existingMapKeys = iconMapObject
    .getProperties()
    .filter((prop) => prop.getKind() === SyntaxKind.PropertyAssignment)
    .map((prop) => prop.getChildAtIndex(0).getText());

  for (const iconName of newIconNames) {
    if (!existingMapKeys.includes(iconName)) {
      const componentName = toPascalCase(iconName);
      iconMapObject.addPropertyAssignment({
        name: iconName,
        initializer: componentName,
      });
    }
  }

  // マッピングをアルファベット順にソート
  const allMapEntries = iconMapObject
    .getProperties()
    .filter((prop) => prop.getKind() === SyntaxKind.PropertyAssignment)
    .map((prop) => ({
      key: prop.getChildAtIndex(0).getText(),
      value: prop.getChildAtIndex(2).getText(),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  iconMapObject.getProperties().forEach((prop) => prop.remove());

  for (const { key, value } of allMapEntries) {
    iconMapObject.addPropertyAssignment({
      name: key,
      initializer: value,
    });
  }

  await sourceFile.save();
  console.log(
    `✨ Updated icon-config.ts with ${missingIcons.length} new icons.`,
  );
}

main().catch(console.error);
