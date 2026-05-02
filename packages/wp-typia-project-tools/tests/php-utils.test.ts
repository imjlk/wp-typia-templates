import { expect, test } from "bun:test";

import {
	escapeRegex,
	findPhpFunctionRange,
	hasPhpFunctionCall,
	hasPhpFunctionDefinition,
	quotePhpString,
	replacePhpFunctionDefinition,
} from "../src/runtime/php-utils.js";

test("quotePhpString escapes single quotes and backslashes for generated PHP", () => {
	expect(quotePhpString("Bob's \\ path")).toBe("'Bob\\'s \\\\ path'");
});

test("escapeRegex produces a literal-safe regular expression fragment", () => {
	const literal = "feature.value[1](draft)?";
	const pattern = new RegExp(`^${escapeRegex(literal)}$`, "u");

	expect(pattern.test(literal)).toBe(true);
	expect(pattern.test("featureXvalue[1](draft)?")).toBe(false);
});

test("findPhpFunctionRange locates a complete PHP function with nested braces", () => {
	const source = `<?php
function keep_me() {
\treturn true;
}

function wp_typia_demo() {
\tif ( true ) {
\t\treturn array( 'ok' => true );
\t}

\treturn array();
}

add_action( 'init', 'wp_typia_demo' );
`;

	const range = findPhpFunctionRange(source, "wp_typia_demo");

	expect(range?.source).toContain("function wp_typia_demo()");
	expect(range?.source).toContain("return array( 'ok' => true );");
	expect(range?.source).not.toContain("add_action");
});

test("findPhpFunctionRange supports return types without spilling into later functions", () => {
	const source = `<?php
function malformed()

function wp_typia_typed() : array {
\treturn array();
}
`;

	expect(findPhpFunctionRange(source, "malformed")).toBeNull();
	expect(findPhpFunctionRange(source, "wp_typia_typed")?.source).toContain(
		"function wp_typia_typed() : array",
	);
});

test("findPhpFunctionRange ignores braces inside PHP string literals", () => {
	const source = `<?php
function wp_typia_demo() {
\t$json = '{"key": {"nested": true}}';
\t$template = "Hello {name}";
\tif ( true ) {
\t\treturn array( 'ok' => true );
\t}
}

function keep_me() {
\treturn true;
}
`;

	const range = findPhpFunctionRange(source, "wp_typia_demo");

	expect(range).not.toBeNull();
	expect(range?.source).toContain(`$json = '{"key": {"nested": true}}';`);
	expect(range?.source).toContain('$template = "Hello {name}";');
	expect(range?.source).not.toContain("function keep_me()");
});

test("findPhpFunctionRange ignores braces inside heredoc and nowdoc content", () => {
	const source = `<?php
function wp_typia_demo() {
\t$json = <<<JSON
{
\t"query": {"postType": "page"}
}
\tJSON;
\t$raw = <<<'NOWDOC'
{
\t"literal": "{$notInterpolated}"
}
\tNOWDOC;
\treturn array();
}

function keep_me() {
\treturn true;
}
`;

	const range = findPhpFunctionRange(source, "wp_typia_demo");

	expect(range).not.toBeNull();
	expect(range?.source).toContain("<<<JSON");
	expect(range?.source).toContain("<<<'NOWDOC'");
	expect(range?.source).not.toContain("function keep_me()");
});

test("findPhpFunctionRange accepts heredoc expression continuations", () => {
	const source = `<?php
function wp_typia_demo() {
\t$values = array(
\t\t<<<JSON
{
\t"query": {"postType": "page"}
}
\t\tJSON,
\t);
\t$trimmed = trim( <<<TEXT
{
\t"label": "demo"
}
\tTEXT );

\treturn array( $values, $trimmed );
}

function keep_me() {
\treturn true;
}
`;

	const range = findPhpFunctionRange(source, "wp_typia_demo");

	expect(range).not.toBeNull();
	expect(range?.source).toContain("JSON,");
	expect(range?.source).toContain("TEXT );");
	expect(range?.source).toContain("return array( $values, $trimmed );");
	expect(range?.source).not.toContain("function keep_me()");
});

test("findPhpFunctionRange preserves PHP 8 attributes instead of treating them as comments", () => {
	const source = `<?php
function wp_typia_demo() {
\t#[ExampleAttribute] class LocalThing {
\t\tpublic function value() {
\t\t\treturn true;
\t\t}
\t}

\treturn array();
}

function keep_me() {
\treturn true;
}
`;

	const range = findPhpFunctionRange(source, "wp_typia_demo");

	expect(range).not.toBeNull();
	expect(range?.source).toContain("#[ExampleAttribute] class LocalThing");
	expect(range?.source).toContain("return array();");
	expect(range?.source).not.toContain("function keep_me()");
});

test("findPhpFunctionRange returns null for unterminated heredoc content", () => {
	const source = `<?php
function wp_typia_demo() {
\t$json = <<<JSON
{
\t"query": {"postType": "page"}
}

function keep_me() {
\treturn true;
}
`;

	expect(findPhpFunctionRange(source, "wp_typia_demo")).toBeNull();
});

test("hasPhpFunctionCall ignores comments, strings, heredoc, and nowdoc", () => {
	const source = `<?php
function wp_typia_demo() {
\t// wp_enqueue_script_module(
\t$single = 'wp_enqueue_script_module(';
\t$double = "wp_enqueue_script_module(";
\t$heredoc = <<<TEXT
wp_enqueue_script_module(
TEXT;
\treturn true;
}
`;

	expect(hasPhpFunctionCall(source, "wp_enqueue_script_module")).toBe(false);
	expect(
		hasPhpFunctionCall(
			`${source}\nwp_enqueue_script_module( 'demo', 'url', array(), null );\n`,
			"wp_enqueue_script_module",
		),
	).toBe(true);
});

test("replacePhpFunctionDefinition replaces only the targeted PHP function", () => {
	const source = `<?php
function wp_typia_demo() {
\tif ( true ) {
\t\treturn array( 'old' => true );
\t}
}

function keep_me() {
\treturn true;
}
`;

	const replaced = replacePhpFunctionDefinition(
		source,
		"wp_typia_demo",
		`
function wp_typia_demo() {
\treturn array( 'new' => true );
}
`,
		{ trimReplacementStart: true },
	);

	expect(replaced).not.toBeNull();
	expect(replaced).toContain("return array( 'new' => true );");
	expect(replaced).not.toContain("return array( 'old' => true );");
	expect(replaced).toContain("function keep_me()");
});

test("hasPhpFunctionDefinition treats function names as literal identifiers", () => {
	const source = `<?php
function wp_typia_feature_value() {
\treturn true;
}
`;

	expect(hasPhpFunctionDefinition(source, "wp_typia_feature_value")).toBe(true);
	expect(hasPhpFunctionDefinition(source, "wp_typia_feature.value")).toBe(false);
});
