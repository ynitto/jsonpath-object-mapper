import { map } from "@src/mapper";
import type { Json, MapOptions, TransformContext } from "@src/mapper";

// biome-ignore lint/suspicious/noExplicitAny: for test
type Result = any;

describe("Examples", () => {
  test("## Usage (1)", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        name: "$.animals[0].name", // Map "Max" found by JsonPath "$.animals[0].name" into cool.name
      },
      cute: {
        species: "$.animals[1].species", // Map "cat" found by JsonPath "$.animals[1].species" into cute.species
      },
      smart: {
        age: "$.animals[2].age", // Map 5 found by JsonPath "$.animals[2].age" into smart.birth
      },
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool.name).toBe("Max");
    expect(result.cute.species).toBe("cat");
    expect(result.smart.age).toBe(5);
  });

  test("## Usage (2)", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        names: [
          "$.animals[0].name", // Map "Max" into cool.names[0]
          "$.animals[1].name", // Map "Bella" into cool.names[1]
          "$.animals[2].name", // Map "Tweety" into cool.names[2]
        ],
      },
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool.names).toHaveLength(3);
    expect(result.cool.names[0]).toBe("Max");
    expect(result.cool.names[1]).toBe("Bella");
    expect(result.cool.names[2]).toBe("Tweety");
  });

  test("## Schema", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        name: "$.animals[0].name", // Map "Max" into cool.name
        species: "sheep", // Map "sheep" into cool.species
      },
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool.name).toBe("Max");
    expect(result.cool.species).toBe("sheep");
  });

  test("### JsonPath", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        names: "$.animals[0].name[]", // Map ["Max"] into cool.name
      },
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool.names).toHaveLength(1);
    expect(result.cool.names[0]).toBe("Max");
  });

  test("### JsonValueSchema", () => {
    const source = {
      animals: [{ name: "Max", species: "dog", age: 3 }],
    };
    const schema = {
      cool: {
        name: {
          "@path": "$.plants[0].name", // Try to find "$.plants[0].name" in source
          "@default": "$.animals[0].name", // Try to find alternatively "$.animals[0].name" in source
          "@transform": (value: Json, _: Json, __: TransformContext) => {
            // Pass "Max" (which is found at "@default") into the function
            return `${value} Smith`; // Transform to "Max Smith" (which is returned from the "@transform") into cool.name
          },
        },
      },
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool.name).toBe("Max Smith");
  });

  test("### JsonElementSchema (1)", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: [
        {
          // This must be defined in an array.
          "@element": {
            name: "$.animals[*].name", // Map "Max" into cool[0].name, "Bella" into cool[1].name
            species: "dog", // Map "dog" into cool[0].species and cool[1].species
          },
          "@length": 2, // Generates an array with two element objects
        },
      ],
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool).toHaveLength(2);
    expect(result.cool[0].name).toBe("Max");
    expect(result.cool[0].species).toBe("dog");
    expect(result.cool[1].name).toBe("Bella");
    expect(result.cool[1].species).toBe("dog");
  });

  test("### JsonElementSchema (2)", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: [
        {
          // This must be defined in an array.
          "@element": {
            name: {
              "@path": "$.animals[0,1].name", // Get "Max", "Bella"
              "@padding": "wrap", // Map as "Max", "Bella", "Max", "Bella"
            },
            species: "dog",
          },
          "@length": 4, // Generates an array with four element objects
        },
      ],
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool).toHaveLength(4);
    expect(result.cool[0].name).toBe("Max");
    expect(result.cool[0].species).toBe("dog");
    expect(result.cool[1].name).toBe("Bella");
    expect(result.cool[1].species).toBe("dog");
    expect(result.cool[2].name).toBe("Max");
    expect(result.cool[2].species).toBe("dog");
    expect(result.cool[3].name).toBe("Bella");
    expect(result.cool[3].species).toBe("dog");
  });

  test("### Escape character", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        name: "`$.animals[0].name", // Map "$.animals[0].name" as is
      },
    };

    const result: Result = map(source, schema);
    console.log(result);

    expect(result.cool.name).toBe("$.animals[0].name");
  });

  test("### Merging (1)", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        name: "$.animals[0].name",
      },
    };
    const target = {
      cute: { species: "sheep" },
    };

    const result: Result = map(source, schema, target); // Map source to a new object and merge target with it
    console.log(result);

    expect(result.cool.name).toBe("Max");
    expect(result.cute.species).toBe("sheep");
  });

  test("### Merging (2)", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: {
        name: "$.animals[0].name", // Try to map "Max" to "cool.name"
        species: "$.animals[0].species", // Try to map "dog" to "cool.species"
      },
    };
    const target = {
      cool: {
        species: "sheep", // But there is already "sheep" on "cool.species"
      },
    };
    const options: MapOptions = {
      objectMergeMode: "preserve", // Try to merge the target with priority
    };

    const result: Result = map(source, schema, target, options); // Map "Max" to "cool.name" and Keep "sheep" to "cool.species"
    console.log(result);

    expect(result.cool.name).toBe("Max");
    expect(result.cool.species).toBe("sheep");
  });

  test("### Merging Arrays", () => {
    const source = {
      animals: [
        { name: "Max", species: "dog", age: 3 },
        { name: "Bella", species: "cat", age: 4 },
        { name: "Tweety", species: "bird", age: 5 },
      ],
    };
    const schema = {
      cool: [
        "$.animals[0]", // Map the "Max" object to "cool[0]"
        "$.animals[1]", // Map the "Bella" object to "cool[1]"
        "$.animals[2]", // Map the "Tweety" object to "cool[2]"
      ],
    };
    const target = {
      cool: [
        { name: "Shaun", species: "sheep", age: 6 }, // There is already "Shaun" object in "cool[]"
      ],
    };
    const options: MapOptions = {
      arrayMergeMode: "append", // Try to merge the target and the mapped arrays.
    };

    const result: Result = map(source, schema, target, options); // As a Result, "cool[]" becomes "Shaun", "Max", "Bella", "Tweety"

    expect(result.cool).toHaveLength(4);
    expect(result.cool[0].name).toBe("Shaun");
    expect(result.cool[0].species).toBe("sheep");
    expect(result.cool[0].age).toBe(6);
    expect(result.cool[1].name).toBe("Max");
    expect(result.cool[1].species).toBe("dog");
    expect(result.cool[1].age).toBe(3);
    expect(result.cool[2].name).toBe("Bella");
    expect(result.cool[2].species).toBe("cat");
    expect(result.cool[2].age).toBe(4);
    expect(result.cool[3].name).toBe("Tweety");
    expect(result.cool[3].species).toBe("bird");
    expect(result.cool[3].age).toBe(5);
  });
});
