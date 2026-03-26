#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to sanitize strings for various cases
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
}

function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase();
}

function toPascalCase(str) {
  return str.replace(/(?:^|[\s_-])(\w)/g, (_, char) => char.toUpperCase()).replace(/[\s_-]/g, '');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Template variables
let templateVars = {};

// Questions for user input
const questions = [
  {
    name: 'title',
    message: 'Block title (e.g., My Awesome Block):',
    default: 'My Typia Block Full',
    transform: (val) => val.trim()
  },
  {
    name: 'description',
    message: 'Block description:',
    default: 'A full-featured WordPress block with Typia validation and advanced features',
    transform: (val) => val.trim()
  },
  {
    name: 'author',
    message: 'Author name:',
    default: 'Your Name',
    transform: (val) => val.trim()
  },
  {
    name: 'slug',
    message: 'Block slug (e.g., my-awesome-block):',
    default: (answers) => toKebabCase(answers.title),
    validate: (val) => {
      if (!/^[a-z][a-z0-9-_]*$/.test(val)) {
        return 'Slug must contain only lowercase letters, numbers, hyphens, and underscores, and start with a letter';
      }
      return true;
    },
    transform: (val) => toKebabCase(val.trim())
  }
];

// Ask questions sequentially
async function askQuestions() {
  for (const question of questions) {
    const answer = await new Promise((resolve) => {
      const ask = () => {
        const prompt = question.message + (question.default ? ` (${typeof question.default === 'function' ? question.default(templateVars) : question.default})` : '') + ': ';
        rl.question(prompt, (input) => {
          let value = input.trim();

          if (!value && question.default) {
            value = typeof question.default === 'function' ? question.default(templateVars) : question.default;
          }

          if (question.transform) {
            value = question.transform(value);
          }

          if (question.validate) {
            const isValid = question.validate(value);
            if (isValid !== true) {
              console.log(`❌ ${isValid}`);
              ask();
              return;
            }
          }

          resolve(value);
        });
      };
      ask();
    });

    templateVars[question.name] = answer;
  }

  // Generate derived variables
  templateVars.slugKebabCase = templateVars.slug;
  templateVars.slugSnakeCase = toSnakeCase(templateVars.slug);
  templateVars.slugCamelCase = toCamelCase(templateVars.slug);
  templateVars.pascalCase = toPascalCase(templateVars.slug);
  templateVars.cssClassName = `wp-block-${templateVars.slug}`;
}

// Process templates
function processTemplate(content) {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (templateVars[key] !== undefined) {
      return templateVars[key];
    }
    console.warn(`⚠️  No replacement found for {{${key}}}`);
    return match;
  });
}

// Process directory recursively
function processDirectory(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      processDirectory(fullPath);
    } else {
      // Only process .mustache files
      if (item.name.endsWith('.mustache')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const processed = processTemplate(content);

        // Write to new filename without .mustache extension
        const newPath = fullPath.slice(0, -9);
        fs.writeFileSync(newPath, processed);

        // Remove the .mustache file
        fs.unlinkSync(fullPath);

        console.log(`✓ Processed: ${newPath}`);
      }
    }
  }
}

// Main setup function
async function setup() {
  console.log('🚀 Setting up your WordPress Typia Full Block\n');

  try {
    // Check if we're in the right directory
    if (!fs.existsSync('./template')) {
      console.error('❌ Error: template directory not found. Please run this script from the package root.');
      process.exit(1);
    }

    // Ask questions
    await askQuestions();

    console.log('\n📝 Configuration:');
    console.log(`   Title: ${templateVars.title}`);
    console.log(`   Slug: ${templateVars.slug}`);
    console.log(`   Description: ${templateVars.description}`);
    console.log(`   Author: ${templateVars.author}\n`);

    // Process template directory
    console.log('🔧 Processing template files...\n');
    processDirectory('./template');

    // Update package.json
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Update scripts to reference the new slug
    const newScripts = {};
    for (const [key, value] of Object.entries(packageJson.scripts)) {
      newScripts[key] = typeof value === 'string'
        ? value.replace(/wp-typia-full/g, templateVars.slugSnakeCase)
        : value;
    }

    packageJson.scripts = newScripts;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, '\t'));

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log(`   1. cd template`);
    console.log(`   2. npm install`);
    console.log(`   3. npm run build`);
    console.log(`   4. Copy the ${templateVars.slug} folder to your WordPress plugins or theme`);
    console.log(`   5. Activate the block in WordPress`);
    console.log('\n🎉 Happy coding with Typia validation!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Check if this package is being installed as a dependency
if (process.env.npm_config_global) {
  console.log('⚠️  This package is not meant to be installed globally.');
  console.log('   Use: npx wp-typia-full');
  process.exit(1);
}

// Run setup
setup();