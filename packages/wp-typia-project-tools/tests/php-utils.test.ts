import { expect, test } from "bun:test";

import {
	escapeRegex,
	findPhpFunctionRange,
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
