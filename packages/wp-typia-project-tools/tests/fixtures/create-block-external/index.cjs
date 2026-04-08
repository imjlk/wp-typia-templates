module.exports = {
	blockTemplatesPath: "block-templates",
	assetsPath: "assets",
	folderName: "seed-src",
	defaultValues: {
		supportsMultiple: false,
		variantLabel: "standard",
	},
	variants: {
		standard: {
			variantLabel: "standard",
		},
		hero: {
			supportsMultiple: true,
			variantLabel: "hero",
		},
	},
	transformer(view) {
		return {
			transformedLabel: `${view.variantLabel}-transformed`,
		};
	},
	pluginTemplatesPath: "plugin-templates",
};
