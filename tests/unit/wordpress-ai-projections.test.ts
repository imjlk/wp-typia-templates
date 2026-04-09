import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

import counterResponseAiSchema from "../../examples/persistence-examples/src/blocks/counter/wordpress-ai/counter-response.ai.schema.json";
import counterAbilitiesProjection from "../../examples/persistence-examples/src/blocks/counter/wordpress-ai/counter.abilities.json";
import { BLOCKS } from "../../examples/persistence-examples/scripts/block-config";
import {
  buildCounterWordPressAiArtifacts,
  COUNTER_ABILITY_CATEGORY,
  COUNTER_AI_RESPONSE_SCHEMA_RELATIVE_PATH,
  COUNTER_WORDPRESS_ABILITY_CONFIG,
} from "../../examples/persistence-examples/scripts/wordpress-ai-projections";

describe("WordPress AI projections", () => {
  const counterWordPressAiManifest = BLOCKS.find(
    (block) => block.slug === "counter"
  )?.restManifest.endpoints.filter(
    (endpoint) => endpoint.operationId !== "getPersistenceCounterBootstrap"
  );

  test("emits an AI-safe counter response schema that compiles under strict AJV without custom keywords", () => {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: true,
    });
    const validate = ajv.compile(counterResponseAiSchema);

    expect(
      validate({
        count: 3,
        postId: 7,
        resourceKey: "demo",
        storage: "custom-table",
      })
    ).toBe(true);
    expect(
      validate({
        count: -1,
        postId: 7.5,
        resourceKey: "",
        storage: "custom-table",
      })
    ).toBe(false);
    expect(
      validate.errors?.some((error) => error.instancePath === "/postId")
    ).toBe(true);
  });

  test("projects exactly two counter abilities with manifest-aligned route metadata and schema wiring", async () => {
    const liveProjected = await buildCounterWordPressAiArtifacts();
    const counterManifest = BLOCKS.find(
      (block) => block.slug === "counter"
    )?.restManifest;

    expect(counterManifest).toBeDefined();
    expect(counterWordPressAiManifest).toBeDefined();
    expect(counterAbilitiesProjection.category).toEqual(
      COUNTER_ABILITY_CATEGORY
    );
    expect(counterAbilitiesProjection.generatedFrom.responseSchemaPath).toBe(
      COUNTER_AI_RESPONSE_SCHEMA_RELATIVE_PATH
    );
    expect(counterAbilitiesProjection.abilities).toHaveLength(2);

    const routeSignatures = counterAbilitiesProjection.abilities.map(
      (ability) => `${ability.method} ${ability.path}`
    );
    const manifestSignatures = counterWordPressAiManifest!.map(
      (endpoint) => `${endpoint.method} ${endpoint.path}`
    );

    expect(routeSignatures).toEqual(manifestSignatures);

    for (const ability of counterAbilitiesProjection.abilities) {
      expect(ability.outputSchema).toEqual(counterResponseAiSchema);
      expect(ability.category).toBe(COUNTER_ABILITY_CATEGORY.id);
      expect(ability.permissionCallback).toBe(
        (
          COUNTER_WORDPRESS_ABILITY_CONFIG as Record<
            string,
            { permissionCallback: string }
          >
        )[ability.operationId]?.permissionCallback
      );
      expect(ability.executeCallback).toBe(
        (
          COUNTER_WORDPRESS_ABILITY_CONFIG as Record<
            string,
            { executeCallback: string }
          >
        )[ability.operationId]?.executeCallback
      );
    }

    const postAbility = liveProjected.abilitiesDocument.abilities.find(
      (ability) => ability.method === "POST"
    );
    const postAbilityInputSchema = postAbility?.inputSchema as
      | {
          required?: string[];
          properties?: {
            postId?: {
              minimum?: number;
            };
          };
        }
      | undefined;

    expect(postAbility).toBeDefined();
    expect(postAbilityInputSchema).toBeDefined();
    expect(postAbilityInputSchema?.required).toContain("publicWriteToken");
    expect(postAbilityInputSchema?.properties?.postId?.minimum).toBe(1);
  });

  test("fails clearly when an endpoint is missing WordPress-only ability metadata", async () => {
    await expect(
      buildCounterWordPressAiArtifacts({
        abilityConfig: {
          getPersistenceCounterState:
            COUNTER_WORDPRESS_ABILITY_CONFIG.getPersistenceCounterState,
        },
      })
    ).rejects.toThrow(
      'Missing WordPress ability projection config for operationId "incrementPersistenceCounterState".'
    );
  });

  test("fails clearly when the counter overlay fields disappear from the increment schema", async () => {
    await expect(
      buildCounterWordPressAiArtifacts({
        manifest: {
          ...BLOCKS.find((block) => block.slug === "counter")!.restManifest,
          endpoints: BLOCKS.find(
            (block) => block.slug === "counter"
          )!.restManifest.endpoints.map((endpoint) =>
            endpoint.method === "POST"
              ? {
                  ...endpoint,
                  bodyContract: "counter-query",
                }
              : endpoint
          ),
        },
      })
    ).rejects.toThrow(
      'The increment request schema must define both "postId" and "publicWriteToken" for the WordPress AI overlay.'
    );
  });

  test("uses the provided category id consistently for the document and every ability", async () => {
    const projected = await buildCounterWordPressAiArtifacts({
      abilityConfig: Object.fromEntries(
        Object.entries(COUNTER_WORDPRESS_ABILITY_CONFIG).map(
          ([operationId, config]) => [
            operationId,
            {
              ...config,
              categoryId: "custom-counter-category",
            },
          ]
        )
      ),
      category: {
        id: "custom-counter-category",
        label: "Custom Counter Category",
      },
    });

    expect(projected.abilitiesDocument.category.id).toBe(
      "custom-counter-category"
    );
    expect(
      projected.abilitiesDocument.abilities.every(
        (ability) => ability.category === "custom-counter-category"
      )
    ).toBe(true);
  });

  test("keeps the example plugin integration explicitly guarded behind WordPress AI and abilities feature detection", () => {
    const phpSource = readFileSync(
      path.join(
        import.meta.dir,
        "..",
        "..",
        "examples",
        "persistence-examples",
        "inc",
        "wordpress-ai.php"
      ),
      "utf8"
    );

    expect(phpSource).toContain("function_exists( 'wp_ai_client_prompt' )");
    expect(phpSource).toContain(
      "function_exists( 'wp_register_ability_category' )"
    );
    expect(phpSource).toContain("function_exists( 'wp_register_ability' )");
  });
});
