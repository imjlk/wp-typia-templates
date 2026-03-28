<?php
declare(strict_types=1);

/**
 * Generated from typia.manifest.json. Do not edit manually.
 */
return new class {
	private array $manifest = [
			'attributes' => [
				'id' => [
					'typia' => [
						'constraints' => [
							'format' => 'uuid',
							'maxLength' => null,
							'maximum' => null,
							'minLength' => null,
							'minimum' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => null,
						'hasDefault' => false
					],
					'ts' => [
						'items' => null,
						'kind' => 'string',
						'properties' => null,
						'required' => false,
						'union' => null
					],
					'wp' => [
						'defaultValue' => null,
						'enum' => null,
						'hasDefault' => false,
						'type' => 'string'
					]
				],
				'version' => [
					'typia' => [
						'constraints' => [
							'format' => null,
							'maxLength' => null,
							'maximum' => null,
							'minLength' => null,
							'minimum' => null,
							'pattern' => null,
							'typeTag' => 'uint32'
						],
						'defaultValue' => 1,
						'hasDefault' => true
					],
					'ts' => [
						'items' => null,
						'kind' => 'number',
						'properties' => null,
						'required' => false,
						'union' => null
					],
					'wp' => [
						'defaultValue' => 1,
						'enum' => null,
						'hasDefault' => true,
						'type' => 'number'
					]
				],
				'className' => [
					'typia' => [
						'constraints' => [
							'format' => null,
							'maxLength' => 100,
							'maximum' => null,
							'minLength' => null,
							'minimum' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => null,
						'hasDefault' => false
					],
					'ts' => [
						'items' => null,
						'kind' => 'string',
						'properties' => null,
						'required' => false,
						'union' => null
					],
					'wp' => [
						'defaultValue' => null,
						'enum' => null,
						'hasDefault' => false,
						'type' => 'string'
					]
				],
				'content' => [
					'typia' => [
						'constraints' => [
							'format' => null,
							'maxLength' => 1000,
							'maximum' => null,
							'minLength' => 0,
							'minimum' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => '',
						'hasDefault' => true
					],
					'ts' => [
						'items' => null,
						'kind' => 'string',
						'properties' => null,
						'required' => true,
						'union' => null
					],
					'wp' => [
						'defaultValue' => '',
						'enum' => null,
						'hasDefault' => true,
						'type' => 'string'
					]
				],
				'alignment' => [
					'typia' => [
						'constraints' => [
							'format' => null,
							'maxLength' => null,
							'maximum' => null,
							'minLength' => null,
							'minimum' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 'left',
						'hasDefault' => true
					],
					'ts' => [
						'items' => null,
						'kind' => 'string',
						'properties' => null,
						'required' => false,
						'union' => null
					],
					'wp' => [
						'defaultValue' => 'left',
						'enum' => [
							'left',
							'center',
							'right',
							'justify'
						],
						'hasDefault' => true,
						'type' => 'string'
					]
				],
				'isVisible' => [
					'typia' => [
						'constraints' => [
							'format' => null,
							'maxLength' => null,
							'maximum' => null,
							'minLength' => null,
							'minimum' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => true,
						'hasDefault' => true
					],
					'ts' => [
						'items' => null,
						'kind' => 'boolean',
						'properties' => null,
						'required' => false,
						'union' => null
					],
					'wp' => [
						'defaultValue' => true,
						'enum' => null,
						'hasDefault' => true,
						'type' => 'boolean'
					]
				]
			],
			'manifestVersion' => 2,
			'sourceType' => 'MyTypiaBlockAttributes'
		];

	public function apply_defaults(array $attributes): array
	{
		return $this->applyDefaultsForObject($attributes, $this->manifest['attributes'] ?? []);
	}

	public function validate(array $attributes): array
	{
		$normalized = $this->apply_defaults($attributes);
		$errors = [];

		foreach (($this->manifest['attributes'] ?? []) as $name => $attribute) {
			$this->validateAttribute(
				array_key_exists($name, $normalized),
				$normalized[$name] ?? null,
				$attribute,
				(string) $name,
				$errors,
			);
		}

		return [
			'errors' => $errors,
			'valid' => count($errors) === 0,
		];
	}

	public function is_valid(array $attributes): bool
	{
		return $this->validate($attributes)['valid'];
	}

	private function applyDefaultsForObject(array $attributes, array $schema): array
	{
		$result = $attributes;

		foreach ($schema as $name => $attribute) {
			if (!array_key_exists($name, $result)) {
				if ($this->hasDefault($attribute)) {
					$result[$name] = $attribute['typia']['defaultValue'];
				}
				continue;
			}

			$result[$name] = $this->applyDefaultsForNode($result[$name], $attribute);
		}

		return $result;
	}

	private function applyDefaultsForNode($value, array $attribute)
	{
		if ($value === null) {
			return null;
		}

		$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
		if ($kind === 'union') {
			return $this->applyDefaultsForUnion($value, $attribute);
		}
		if ($kind === 'object' && is_array($value) && !$this->isListArray($value)) {
			return $this->applyDefaultsForObject($value, $attribute['ts']['properties'] ?? []);
		}
		if (
			$kind === 'array' &&
			is_array($value) &&
			$this->isListArray($value) &&
			isset($attribute['ts']['items']) &&
			is_array($attribute['ts']['items'])
		) {
			$result = [];
			foreach ($value as $index => $item) {
				$result[$index] = $this->applyDefaultsForNode($item, $attribute['ts']['items']);
			}
			return $result;
		}

		return $value;
	}

	private function applyDefaultsForUnion($value, array $attribute)
	{
		if (!is_array($value) || $this->isListArray($value)) {
			return $value;
		}

		$union = $attribute['ts']['union'] ?? null;
		if (!is_array($union)) {
			return $value;
		}

		$discriminator = $union['discriminator'] ?? null;
		if (!is_string($discriminator) || !array_key_exists($discriminator, $value)) {
			return $value;
		}

		$branchKey = $value[$discriminator];
		if (!is_string($branchKey) || !isset($union['branches'][$branchKey]) || !is_array($union['branches'][$branchKey])) {
			return $value;
		}

		return $this->applyDefaultsForNode($value, $union['branches'][$branchKey]);
	}

	private function validateAttribute(bool $exists, $value, array $attribute, string $path, array &$errors): void
	{
		if (!$exists) {
			if (($attribute['ts']['required'] ?? false) && !$this->hasDefault($attribute)) {
				$errors[] = sprintf('%s is required', $path);
			}
			return;
		}

		$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
		if (!is_string($kind) || $kind === '') {
			$errors[] = sprintf('%s has an invalid schema kind', $path);
			return;
		}
		if ($value === null) {
			$errors[] = sprintf('%s must be %s', $path, $this->expectedKindLabel($attribute));
			return;
		}

		if (($attribute['wp']['enum'] ?? null) !== null && !$this->valueInEnum($value, $attribute['wp']['enum'])) {
			$errors[] = sprintf('%s must be one of %s', $path, implode(', ', $attribute['wp']['enum']));
		}

		switch ($kind) {
			case 'string':
				if (!is_string($value)) {
					$errors[] = sprintf('%s must be string', $path);
					return;
				}
				$this->validateString($value, $attribute, $path, $errors);
				return;
			case 'number':
				if (!$this->isNumber($value)) {
					$errors[] = sprintf('%s must be number', $path);
					return;
				}
				$this->validateNumber($value, $attribute, $path, $errors);
				return;
			case 'boolean':
				if (!is_bool($value)) {
					$errors[] = sprintf('%s must be boolean', $path);
				}
				return;
			case 'array':
				if (!is_array($value) || !$this->isListArray($value)) {
					$errors[] = sprintf('%s must be array', $path);
					return;
				}
				if (isset($attribute['ts']['items']) && is_array($attribute['ts']['items'])) {
					foreach ($value as $index => $item) {
						$this->validateAttribute(true, $item, $attribute['ts']['items'], sprintf('%s[%s]', $path, (string) $index), $errors);
					}
				}
				return;
			case 'object':
				if (!is_array($value) || $this->isListArray($value)) {
					$errors[] = sprintf('%s must be object', $path);
					return;
				}
				foreach (($attribute['ts']['properties'] ?? []) as $name => $child) {
					$this->validateAttribute(
						array_key_exists($name, $value),
						$value[$name] ?? null,
						$child,
						sprintf('%s.%s', $path, (string) $name),
						$errors,
					);
				}
				return;
			case 'union':
				$this->validateUnion($value, $attribute, $path, $errors);
				return;
			default:
				$errors[] = sprintf('%s has unsupported schema kind %s', $path, $kind);
		}
	}

	private function validateUnion($value, array $attribute, string $path, array &$errors): void
	{
		if (!is_array($value) || $this->isListArray($value)) {
			$errors[] = sprintf('%s must be object', $path);
			return;
		}

		$union = $attribute['ts']['union'] ?? null;
		if (!is_array($union)) {
			$errors[] = sprintf('%s has invalid union schema metadata', $path);
			return;
		}

		$discriminator = $union['discriminator'] ?? null;
		if (!is_string($discriminator) || $discriminator === '') {
			$errors[] = sprintf('%s has invalid union discriminator metadata', $path);
			return;
		}
		if (!array_key_exists($discriminator, $value)) {
			$errors[] = sprintf('%s.%s is required', $path, $discriminator);
			return;
		}

		$branchKey = $value[$discriminator];
		if (!is_string($branchKey)) {
			$errors[] = sprintf('%s.%s must be string', $path, $discriminator);
			return;
		}
		if (!isset($union['branches'][$branchKey]) || !is_array($union['branches'][$branchKey])) {
			$errors[] = sprintf('%s.%s must be one of %s', $path, $discriminator, implode(', ', array_keys($union['branches'] ?? [])));
			return;
		}

		$this->validateAttribute(true, $value, $union['branches'][$branchKey], $path, $errors);
	}

	private function validateString(string $value, array $attribute, string $path, array &$errors): void
	{
		$constraints = $attribute['typia']['constraints'] ?? [];

		if (isset($constraints['minLength']) && is_int($constraints['minLength']) && strlen($value) < $constraints['minLength']) {
			$errors[] = sprintf('%s must be at least %d characters', $path, $constraints['minLength']);
		}
		if (isset($constraints['maxLength']) && is_int($constraints['maxLength']) && strlen($value) > $constraints['maxLength']) {
			$errors[] = sprintf('%s must be at most %d characters', $path, $constraints['maxLength']);
		}
		if (
			isset($constraints['pattern']) &&
			is_string($constraints['pattern']) &&
			$constraints['pattern'] !== '' &&
			!$this->matchesPattern($constraints['pattern'], $value)
		) {
			$errors[] = sprintf('%s does not match %s', $path, $constraints['pattern']);
		}
		if (
			isset($constraints['format']) &&
			$constraints['format'] === 'uuid' &&
			!$this->matchesUuid($value)
		) {
			$errors[] = sprintf('%s must be a uuid', $path);
		}
	}

	private function validateNumber($value, array $attribute, string $path, array &$errors): void
	{
		$constraints = $attribute['typia']['constraints'] ?? [];

		if (isset($constraints['minimum']) && $this->isNumber($constraints['minimum']) && $value < $constraints['minimum']) {
			$errors[] = sprintf('%s must be >= %s', $path, (string) $constraints['minimum']);
		}
		if (isset($constraints['maximum']) && $this->isNumber($constraints['maximum']) && $value > $constraints['maximum']) {
			$errors[] = sprintf('%s must be <= %s', $path, (string) $constraints['maximum']);
		}
		if (($constraints['typeTag'] ?? null) === 'uint32') {
			if (!is_int($value) || $value < 0 || $value > 4294967295) {
				$errors[] = sprintf('%s must be a uint32', $path);
			}
		}
	}

	private function hasDefault(array $attribute): bool
	{
		return ($attribute['typia']['hasDefault'] ?? false) === true;
	}

	private function valueInEnum($value, array $enum): bool
	{
		foreach ($enum as $candidate) {
			if ($candidate === $value) {
				return true;
			}
		}
		return false;
	}

	private function matchesPattern(string $pattern, string $value): bool
	{
		$escapedPattern = str_replace('~', '\\~', $pattern);
		$result = @preg_match('~' . $escapedPattern . '~u', $value);
		return $result === 1;
	}

	private function matchesUuid(string $value): bool
	{
		return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) === 1;
	}

	private function isNumber($value): bool
	{
		return is_int($value) || is_float($value);
	}

	private function isListArray(array $value): bool
	{
		$expectedKey = 0;
		foreach ($value as $key => $_item) {
			if ($key !== $expectedKey) {
				return false;
			}
			$expectedKey += 1;
		}
		return true;
	}

	private function expectedKindLabel(array $attribute): string
	{
		$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? 'value';
		return $kind === 'union' ? 'object' : (string) $kind;
	}
};
