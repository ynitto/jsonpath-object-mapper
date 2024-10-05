# jsonpath-object-mapper

## About

Utility to copy properties from one object to another based on
given a schema object, which defines which properties should be mapped.
This is inspired by [object-mapper](https://github.com/wankdanker/node-object-mapper) and [jsonpath-mapper](https://github.com/neilflatley/jsonpath-mapper) and also have these features;
- Typescript support
- Map an object to another by using JsonPath expression in a schema object
- Generate array elements with various options
- Merge objects and arrays with various options

## Installation

```shell
$ npm install jsonpath-object-mapper
```
or
```shell
$ yarn add jsonpath-object-mapper
```

## Usage

Call `map()` function with a source and schema object.

```javascript
import { map } from "jsonpath-object-mapper";

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
    age: "$.animals[2].age", // Map 5 found by JsonPath "$.animals[2].age" into smart.age
  },
};

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "Max" }, cute: { species: "cat" }, smart: { age: 5 } }
```

Array elements can be mapped same as any other value.

```javascript
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

const result = map(source, schema);
console.log(result);

// Output: { cool: { names: ["Max", "Bella", "Tweety"] } }
```

## Schema

The schema object define mapping structures and values. The object has the following key-value pairs;
- `key` represents the property key to be stored.
- `value` represents the property value or JsonPath expression to look it up.

```javascript
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

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "Max", species: "sheep" } }
```

### JsonPath

You can use JsonPath expression to look up values ​​from an source object.
See [JsonPath Plus](https://github.com/JSONPath-Plus/JSONPath) for supported JsonPath expression syntax.

The result of looking up with JsonPath will become an array.
However, for value mapping, it is treated as a single value if the result array has a length of 1.

If you want to treat it as an array, add "[]" to the end of JsonPath expression.

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", age: 3 },
    { name: "Bella", species: "cat", age: 4 },
    { name: "Tweety", species: "bird", age: 5 },
  ],
};
const schema = {
  cool: {
    name: "$.animals[0].name[]", // Map ["Max"] into cool.name
  },
};

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: ["Max"] } }
```

### JsonValueSchema

Instead of a value or JsonPath, you can specify a special object, called JsonValueSchema,
with the following properties;
- `@path` (required): The property value or JsonPath expression.
- `@default` (optional): The property value or JsonPath expression when `@path` yields no value.
- `@transform` (optional): The function to transform the property value to be yielded by `@path` or @default.

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", age: 3 },
  ],
};
const schema = {
  cool: {
    name: {
      "@path": "$.plants[0].name", // Try to find "$.plants[0].name" in source
      "@default": "$.animals[0].name", // Try to find alternatively "$.animals[0].name" in source
      "@transform": (value) => { // Pass "Max" (which is found at "@default") into the function
        return value + " Smith"; // Transform to "Max Smith" (which is returned from the "@transform") into cool.name
      },
    },
  },
};

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "Max Smith" } }
```

### JsonElementSchema

You sometimes want to generate an array of object which has new structure with mapping values.
In this case, instead of a element value, you can specify a special object, called JsonElementSchema,
with the following properties;
- `@element` (required): Definition object for each property of an element object. It has the following key-value pairs;
  - `key` represents the property key of an element object to be stored.
  - `value` represents the property value, JsonPath or JsonValueSchema of an element object.
    - For a single value, store it as a property `key` of each element object.
    - For arrays, select a value from the array according to the index of each element object and store it as the object's property `key`.
- `@length` (optional): Length of the generated array.
  - For a number, used as is.
  - For an array, used the length of it.
  - If omitted, used the maximum length of `value` in `@element`.

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", age: 3 },
    { name: "Bella", species: "cat", age: 4 },
    { name: "Tweety", species: "bird", age: 5 },
  ],
};
const schema = {
  cool: [{ // This must be defined in an array.
    "@element": {
      name: "$.animals[*].name", // Map "Max" into cool[0].name, "Bella" into cool[1].name
      species: "dog", // Map "dog" into cool[0].species and cool[1].species
    },
    "@length": 2, // Generates an array with two element objects
  }],
};

const result = map(source, schema);
console.log(result);

// Output:
// {
//   cool: [
//     { name: "Max", species: "dog" },
//     { name: "Bella", species: "dog" },
//   ]
// }
```

When specifying JsonValueSchema at `value` of `@element`, you can include the following properties;
- `@padding`: How to pad when there are not enough property values ​​to store into the element objects. Select one of the following values;
  - edge: Pad with the last value in the array. (default for a single value)
  - empty: Not pad, that is, not store. (default for an array)
  - wrap: Pad values as the array repeats continuously.
  - reflect: Pad values as the reversed array repeats continuously.

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", age: 3 },
    { name: "Bella", species: "cat", age: 4 },
    { name: "Tweety", species: "bird", age: 5 },
  ],
};
const schema = {
  cool: [{ // This must be defined in an array.
    "@element": {
      name: {
        "@path": "$.animals[0,1].name", // Get "Max", "Bella"
        "@padding": "wrap", // Map as "Max", "Bella", "Max", "Bella"
      },
      species: "dog",
    },
    "@length": 4, // Generates an array with four element objects
  }],
};

const result = map(source, schema);
console.log(result);

// Output:
// {
//   cool: [
//     { name: "Max", species: "dog" },
//     { name: "Bella", species: "dog" },
//     { name: "Max", species: "dog" },
//     { name: "Bella", species: "dog" },
//   ]
// }
```

### Escape character

If you want to treat as a pure string for reserved words, like JsonPath "$.animals.name", "@path",
you can escape them by adding "`" at the beginning.


```javascript
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

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "$.animals.name" } }
```

## Merging
You can merge a target object with a mapped object by calling `map()` with it.

```javascript
import { map } from "jsonpath-object-mapper";

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

const result = map(source, schema, target); // Map source to a new object and merge target with it
console.log(result);

// Output: { cool: { name: "Max" }, cute: { species: "sheep" } }
```

Also, if you want to customize how merge objects, you can call `map()` with the following value in `option.objectMergeMode`.
- overwrite: Merge deeply values of a mapped object with priority. (default)
- preserve: Merge deeply values of a target object with priority.
- replace: Ignore a target object and do not merge. Use when you refer to it in the specified `@transform` function.

```javascript
import { map } from "jsonpath-object-mapper";

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
const options = {
  objectMergeMode: "preserve", // Try to merge the target with priority
};

const result = map(source, schema, target, options); // Map "Max" to "cool.name" and Keep "sheep" to "cool.species"
console.log(result);

// Output: { cool: { name: "Max", species: "sheep" } }
```

### Merging Arrays

You can also merge arrays of a target object with arrays of a mapped object.
By default, arrays of a target object are ignored and not merged.
You can call `map()` with the following value in `option.arrayMergeMode` if you want to merge.
- replace: Ignore a target object and do not merge. (default)
- append: Merge an array of a target object with an array of a mapped object. The target array comes first.
- prepend: Merge an array of a target object with an array of a mapped object. The mapped array comes first.

```javascript
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
const options = {
  arrayMergeMode: "append", // Try to merge the target and the mapped arrays.
};

const result = map(source, schema, target, options); // As a Result, "cool[]" becomes "Shaun", "Max", "Bella", "Tweety"
console.log(result);

const result = map(source, schema);
console.log(result);

// Output:
// {
//   cool: [
//     { name: "Shaun", species: "sheep" age: 6 },
//     { name: "Max", species: "dog", age: 3 },
//     { name: "Bella", species: "cat", age: 4 },
//     { name: "Tweety", species: "bird", age: 5 },
//   ]
// }
```

## Methods

- map(source, schema[, target, options])
Map values from source by the mapping definition schema.

- `source` (required): the object from which properties will be copied.
- `schema` (required): the definition object of mapping structures and values.
- `target` (optional): the target object to be merged.
- `options` (optional): the options of `map()` process.
  - objectMergeMode (optional): How to merge `target` and the mapped object.
  - arrayMergeMode (optional): How to merge arrays in `target` and the mapped object.

## License

### The MIT License (MIT)

Copyright (c) 2024 ynitto

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
