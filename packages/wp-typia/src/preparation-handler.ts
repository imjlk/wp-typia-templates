/**
 * Return the shared placeholder message for Bunli-prep commands that have not
 * taken over active execution yet.
 *
 * @param commandPath Future Bunli command path such as `add block`.
 * @returns Human-readable migration message.
 */
export function createPreparationOnlyMessage(commandPath: string): string {
	return [
		`The Bunli-native \`wp-typia ${commandPath}\` command is staged for the next CLI migration round.`,
		"Keep using the published `wp-typia` bin in this release while the active runtime remains on the compatibility bridge.",
	].join(" ");
}

/**
 * Throw the shared Bunli-prep placeholder error.
 *
 * @param commandPath Future Bunli command path such as `create`.
 * @returns Promise that always rejects.
 */
export async function runPreparationOnlyCommand(commandPath: string): Promise<never> {
	throw new Error(createPreparationOnlyMessage(commandPath));
}
