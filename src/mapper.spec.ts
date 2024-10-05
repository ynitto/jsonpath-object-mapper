import { map } from "@src/mapper";
import type { Json, MapOptions, TransformContext } from "@src/mapper";

// biome-ignore lint/suspicious/noExplicitAny: for test
type Result = any;

it("should map to an object", () => {
  // Given
  const source = {
    src: {
      x: "foo",
      y: 1,
      z: true,
      xx: ["bar", 2, false],
    },
  };
  const schema = {
    dst: {
      a: "$.src.x",
      b: "$.src.y",
      c: "$.src.z",
      d: "$.src.xx",
      e: "$.src",
      f: "const",
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toBe("foo");
  expect(result.dst.b).toBe(1);
  expect(result.dst.c).toBe(true);
  expect(result.dst.d).toHaveLength(3);
  expect(result.dst.d[0]).toBe("bar");
  expect(result.dst.d[1]).toBe(2);
  expect(result.dst.d[2]).toBe(false);
  expect(result.dst.e).toBeTruthy();
  expect(result.dst.e.x).toBe("foo");
  expect(result.dst.e.y).toBe(1);
  expect(result.dst.e.z).toBe(true);
  expect(result.dst.e.xx).toHaveLength(3);
  expect(result.dst.e.xx[0]).toBe("bar");
  expect(result.dst.e.xx[1]).toBe(2);
  expect(result.dst.e.xx[2]).toBe(false);
  expect(result.dst.f).toBe("const");
});

it("should map to an array", () => {
  // Given
  const source = {
    src: {
      items: [
        { name: "Max", species: "dog", birth: 2022 },
        { name: "Bella", species: "cat", birth: 2023 },
        { name: "Tweety", species: "bird", birth: 2024 },
      ],
    },
  };
  const schema = {
    dst: {
      a: ["$.src.items[0].name", "$.src.items[1].name", "$.src.items[2].name"],
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toHaveLength(3);
  expect(result.dst.a[0]).toBe("Max");
  expect(result.dst.a[1]).toBe("Bella");
  expect(result.dst.a[2]).toBe("Tweety");
});

it("should map to an object and array", () => {
  // Given
  const source = {
    src: {
      items: [{ name: "dog" }, { name: "cat" }, { name: "bird" }],
    },
  };
  const schema = {
    dst: {
      a: "$.src..name",
      b: "$.src.items[0].name[]",
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toHaveLength(3);
  expect(result.dst.a[0]).toBe("dog");
  expect(result.dst.a[1]).toBe("cat");
  expect(result.dst.a[2]).toBe("bird");
  expect(result.dst.b).toHaveLength(1);
  expect(result.dst.b[0]).toBe("dog");
});

it("should map an object with default", () => {
  // Given
  const source = {
    src: {
      x: "cat",
      y: 0,
      z: false,
    },
  };
  const schema = {
    dst: {
      a: {
        "@path": "$.src.a",
        "@default": "bird",
      },
      b: {
        "@path": "$.src.y",
        "@default": 100,
      },
      c: {
        "@path": "$.src.z",
        "@default": true,
      },
      d: {
        "@path": "$.src.xx",
        "@default": undefined,
      },
      e: {
        "@path": "$.src.xx",
        "@default": "$.src.x",
      },
      f: {
        "@path": "$.src.x",
        "@default": "bird",
      },
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toBe("bird");
  expect(result.dst.b).toBe(0);
  expect(result.dst.c).toBe(false);
  expect(result.dst.d).toBeUndefined();
  expect(result.dst.e).toBe("cat");
  expect(result.dst.f).toBe("cat");
});

it("should transform objects", () => {
  // Given
  const source = {
    src: {
      x: "cat",
      y: 1,
      z: true,
      xx: ["bird", 2, false],
    },
  };
  const target = {
    dst: {
      b: {
        a: "dog",
      },
      c: ["dog", "cat"],
      e: "bird",
    },
  };
  const schema = {
    dst: {
      a: {
        "@path": "$.src.x",
        "@transform": (value: Json, dst: Json, context: TransformContext) => {
          expect(value).toBe(source.src.x);
          expect(dst).toBeUndefined();
          expect(context.source).toBe(source);
          expect(context.schema).toBe(schema.dst.a["@path"]);
          return "dog_cat_bird";
        },
      },
      b: {
        "@path": "$.src.y",
        "@transform": (value: Json, dst: Json, context: TransformContext) => {
          expect(value).toBe(source.src.y);
          expect(dst).toBe(target.dst.b);
          expect(context.source).toBe(source);
          expect(context.schema).toBe(schema.dst.b["@path"]);
          return { b: "dog_cat_bird" };
        },
      },
      c: {
        "@path": "$.src.z",
        "@transform": (value: Json, dst: Json, context: TransformContext) => {
          expect(value).toBe(source.src.z);
          expect(dst).toBe(target.dst.c);
          expect(context.source).toBe(source);
          expect(context.schema).toBe(schema.dst.c["@path"]);
          return 1;
        },
      },
      d: {
        "@path": "$.src.xx",
        "@transform": (value: Json, dst: Json, context: TransformContext) => {
          expect(value).toBe(source.src.xx);
          expect(dst).toBeUndefined();
          expect(context.source).toBe(source);
          expect(context.schema).toBe(schema.dst.d["@path"]);
          return ["dog_cat_bird"];
        },
      },
    },
  };

  // When
  const result: Result = map(source, schema, target);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toBe("dog_cat_bird");
  expect(result.dst.b.a).toBe("dog");
  expect(result.dst.b.b).toBe("dog_cat_bird");
  expect(result.dst.c).toBe(1);
  expect(result.dst.d).toHaveLength(1);
  expect(result.dst.d[0]).toBe("dog_cat_bird");
  expect(result.dst.e).toBe("bird");
});

it("should merge objects by preserve", () => {
  // Given
  const source = {
    src: {
      x: "dog",
      y: "cat",
      z: "bird",
    },
  };
  const schema = {
    dst: {
      a: "$.src.x",
      b: "$.src.y",
      c: "$.src.z",
    },
  };
  const target = {
    dst: {
      b: {
        a: "dog",
      },
      c: ["dog", "cat"],
      d: "sheep",
    },
  };
  const options: MapOptions = {
    objectMergeMode: "preserve",
  };

  // When
  const result: Result = map(source, schema, target, options);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toBe("dog");
  expect(result.dst.b).toBeTruthy();
  expect(result.dst.b.a).toBe("dog");
  expect(result.dst.c).toHaveLength(2);
  expect(result.dst.c[0]).toBe("dog");
  expect(result.dst.c[1]).toBe("cat");
  expect(result.dst.d).toBe("sheep");
});

it("should merge objects by replace", () => {
  // Given
  const source = {
    src: {
      x: "dog",
      y: "cat",
      z: "bird",
    },
  };
  const schema = {
    dst: {
      a: "$.src.x",
      b: "$.src.y",
      c: "$.src.z",
    },
  };
  const target = {
    dst: {
      b: {
        a: "dog",
      },
      c: ["dog", "cat"],
      d: "sheep",
    },
  };
  const options: MapOptions = {
    objectMergeMode: "replace",
  };

  // When
  const result: Result = map(source, schema, target, options);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toBe("dog");
  expect(result.dst.b).toBe("cat");
  expect(result.dst.c).toBe("bird");
});

it("should map items of an array", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      items: [
        { label: "$.src.labels[0]" },
        { label: "$.src.labels[1]" },
        { label: "$.src.labels[2]" },
      ],
    },
  };
  const target = {
    dst: {
      items: ["sheep", "mouse"],
    },
  };

  // When
  const result: Result = map(source, schema, target);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(3);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[2].label).toBe("bird");
});

it("should merge items of arrays with append", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      items: [
        { label: "$.src.labels[0]" },
        { label: "$.src.labels[1]" },
        { label: "$.src.labels[2]" },
      ],
    },
  };
  const target = {
    dst: {
      items: ["sheep", { label: "mouse" }],
    },
  };
  const options: MapOptions = {
    arrayMergeMode: "append",
  };

  // When
  const result: Result = map(source, schema, target, options);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(5);
  expect(result.dst.items[0]).toBe("sheep");
  expect(result.dst.items[1].label).toBe("mouse");
  expect(result.dst.items[2].label).toBe("dog");
  expect(result.dst.items[3].label).toBe("cat");
  expect(result.dst.items[4].label).toBe("bird");
});

it("should merge items of arrays with prepend", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      items: [
        { label: "$.src.labels[0]" },
        { label: "$.src.labels[1]" },
        { label: "$.src.labels[2]" },
      ],
    },
  };
  const target = {
    dst: {
      items: ["sheep", { label: "mouse" }],
    },
  };
  const options: MapOptions = {
    arrayMergeMode: "prepend",
  };

  // When
  const result: Result = map(source, schema, target, options);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(5);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[2].label).toBe("bird");
  expect(result.dst.items[3]).toBe("sheep");
  expect(result.dst.items[4].label).toBe("mouse");
});

it("should merge items of arrays with preserve and append", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      items: [
        { label: "$.src.labels[0]" },
        { label: "$.src.labels[1]" },
        { label: "$.src.labels[2]" },
      ],
    },
  };
  const target = {
    dst: {
      items: ["sheep", "mouse"],
    },
  };
  const options: MapOptions = {
    objectMergeMode: "preserve",
    arrayMergeMode: "append",
  };

  // When
  const result: Result = map(source, schema, target, options);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(5);
  expect(result.dst.items[0]).toBe("sheep");
  expect(result.dst.items[1]).toBe("mouse");
  expect(result.dst.items[2].label).toBe("dog");
  expect(result.dst.items[3].label).toBe("cat");
  expect(result.dst.items[4].label).toBe("bird");
});

it("should merge items of arrays with preserve and prepend", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      items: [
        { label: "$.src.labels[0]" },
        { label: "$.src.labels[1]" },
        { label: "$.src.labels[2]" },
      ],
    },
  };
  const target = {
    dst: {
      items: ["sheep", "mouse"],
    },
  };
  const options: MapOptions = {
    objectMergeMode: "preserve",
    arrayMergeMode: "prepend",
  };

  // When
  const result: Result = map(source, schema, target, options);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(5);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[2].label).toBe("bird");
  expect(result.dst.items[3]).toBe("sheep");
  expect(result.dst.items[4]).toBe("mouse");
});

it("should yield items of an array", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
      counts: [100, 200],
    },
  };
  const schema = {
    dst: {
      items: [
        {
          "@element": {
            label: "$.src.labels",
            count: "$.src.counts",
            name: "dog_cat_bird",
            void: null,
          },
        },
      ],
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(3);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[0].count).toBe(100);
  expect(result.dst.items[0].name).toBe("dog_cat_bird");
  expect(result.dst.items[0].void).toBe(null);
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[1].count).toBe(200);
  expect(result.dst.items[1].name).toBe("dog_cat_bird");
  expect(result.dst.items[1].void).toBe(null);
  expect(result.dst.items[2].label).toBe("bird");
  expect(result.dst.items[2].count).toBeUndefined();
  expect(result.dst.items[2].name).toBe("dog_cat_bird");
  expect(result.dst.items[2].void).toBe(null);
});

it("should yield items of an array with padding", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird", "sheep", "mouse", "ahh"],
      counts: [100, 200],
      names: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      items: [
        {
          "@element": {
            label: "$.src.labels",
            count: {
              "@path": "$.src.counts",
              "@padding": "edge",
            },
            label2: {
              "@path": "$.src.names",
              "@padding": "reflect",
            },
            label3: {
              "@path": "$.src.names",
              "@padding": "wrap",
            },
            label4: {
              "@path": "constant",
              "@padding": "empty",
            },
          },
        },
      ],
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(6);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[0].count).toBe(100);
  expect(result.dst.items[0].label2).toBe("dog");
  expect(result.dst.items[0].label3).toBe("dog");
  expect(result.dst.items[0].label4).toBe("constant");
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[1].count).toBe(200);
  expect(result.dst.items[1].label2).toBe("cat");
  expect(result.dst.items[1].label3).toBe("cat");
  expect(result.dst.items[1].label4).toBeUndefined();
  expect(result.dst.items[2].label).toBe("bird");
  expect(result.dst.items[2].count).toBe(200);
  expect(result.dst.items[2].label2).toBe("bird");
  expect(result.dst.items[2].label3).toBe("bird");
  expect(result.dst.items[2].label4).toBeUndefined();
  expect(result.dst.items[3].label).toBe("sheep");
  expect(result.dst.items[3].count).toBe(200);
  expect(result.dst.items[3].label2).toBe("bird");
  expect(result.dst.items[3].label3).toBe("dog");
  expect(result.dst.items[3].label4).toBeUndefined();
  expect(result.dst.items[4].label).toBe("mouse");
  expect(result.dst.items[4].count).toBe(200);
  expect(result.dst.items[4].label2).toBe("cat");
  expect(result.dst.items[4].label3).toBe("cat");
  expect(result.dst.items[4].label4).toBeUndefined();
  expect(result.dst.items[5].label).toBe("ahh");
  expect(result.dst.items[5].count).toBe(200);
  expect(result.dst.items[5].label2).toBe("dog");
  expect(result.dst.items[5].label3).toBe("bird");
  expect(result.dst.items[5].label4).toBeUndefined();
});

it("should yield items of an array with length", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
      counts: [100, 200],
    },
  };
  const schema = {
    dst: {
      items1: [
        {
          "@element": {
            label: "$.src.labels",
            count: {
              "@path": "$.src.counts",
              "@padding": "edge",
            },
          },
          "@length": 1,
        },
      ],
      items2: [
        {
          "@element": {
            label: "$.src.labels",
            count: {
              "@path": "$.src.counts",
              "@padding": "edge",
            },
          },
          "@length": "$.src.counts",
        },
      ],
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items1).toHaveLength(1);
  expect(result.dst.items1[0].label).toBe("dog");
  expect(result.dst.items1[0].count).toBe(100);
  expect(result.dst?.items2).toHaveLength(2);
  expect(result.dst.items2[0].label).toBe("dog");
  expect(result.dst.items2[0].count).toBe(100);
  expect(result.dst.items2[1].label).toBe("cat");
  expect(result.dst.items2[1].count).toBe(200);
});

it("should combine yielded items of an array", () => {
  // Given
  const source = {
    src: {
      labels: ["dog", "cat", "bird"],
      counts: [100, 200],
    },
  };
  const schema = {
    dst: {
      items: [
        {
          "@element": {
            label: "$.src.labels",
            count: {
              "@path": "$.src.counts",
              "@padding": "edge",
            },
            total: {
              "@path": "$.src.counts",
              "@padding": "reflect",
            },
            tag: "cat",
          },
        },
        {
          "@element": {
            label: "$.src.labels",
            count: {
              "@path": "$.src.counts",
              "@padding": "empty",
            },
            total: {
              "@path": "$.src.counts",
              "@padding": "wrap",
            },
            tag: "$.src.labels",
          },
        },
      ],
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst?.items).toHaveLength(6);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[0].count).toBe(100);
  expect(result.dst.items[0].total).toBe(100);
  expect(result.dst.items[0].tag).toBe("cat");
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[1].count).toBe(200);
  expect(result.dst.items[1].total).toBe(200);
  expect(result.dst.items[1].tag).toBe("cat");
  expect(result.dst.items[2].label).toBe("bird");
  expect(result.dst.items[2].count).toBe(200);
  expect(result.dst.items[2].total).toBe(200);
  expect(result.dst.items[2].tag).toBe("cat");
  expect(result.dst.items[3].label).toBe("dog");
  expect(result.dst.items[3].count).toBe(100);
  expect(result.dst.items[3].total).toBe(100);
  expect(result.dst.items[3].tag).toBe("dog");
  expect(result.dst.items[4].label).toBe("cat");
  expect(result.dst.items[4].count).toBe(200);
  expect(result.dst.items[4].total).toBe(200);
  expect(result.dst.items[4].tag).toBe("cat");
  expect(result.dst.items[5].label).toBe("bird");
  expect(result.dst.items[5].count).toBeUndefined();
  expect(result.dst.items[5].total).toBe(100);
  expect(result.dst.items[5].tag).toBe("bird");
});

it("should map an object with escape", () => {
  // Given
  const source = {
    src: {
      a: "$.src.labels",
      labels: ["dog", "cat", "bird"],
    },
  };
  const schema = {
    dst: {
      a: "`$.src.a",
      b: "$.src.a",
      items: [
        {
          "@element": {
            label: "$.src.labels",
            name: "`$.src.labels",
          },
        },
      ],
      items2: [
        {
          "`@element": {
            label: "`$.src.labels",
            name: "$.src.labels",
          },
        },
      ],
    },
  };

  // When
  const result: Result = map(source, schema);

  // Then
  expect(result).toBeTruthy();
  expect(result.dst.a).toBe("$.src.a");
  expect(result.dst.b).toBe("$.src.labels");
  expect(result.dst?.items).toHaveLength(3);
  expect(result.dst.items[0].label).toBe("dog");
  expect(result.dst.items[1].label).toBe("cat");
  expect(result.dst.items[2].label).toBe("bird");
  expect(result.dst.items[0].name).toBe("$.src.labels");
  expect(result.dst.items[1].name).toBe("$.src.labels");
  expect(result.dst.items[2].name).toBe("$.src.labels");
  expect(result.dst?.items2).toHaveLength(1);
  expect(result.dst.items2).toHaveLength(1);
  expect(result.dst.items2[0]["@element"].label).toBe("$.src.labels");
  expect(result.dst.items2[0]["@element"].name).toHaveLength(3);
  expect(result.dst.items2[0]["@element"].name[0]).toBe("dog");
  expect(result.dst.items2[0]["@element"].name[1]).toBe("cat");
  expect(result.dst.items2[0]["@element"].name[2]).toBe("bird");
});
