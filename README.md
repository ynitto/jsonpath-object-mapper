# jsonpath-object-mapper

## About

Utility to copy properties from one `Object` to another based on
instructions given in a schema `Object`, which defines which properties should be mapped values resolved by `JSONPath` expression.

This is inspired by [object-mapper](https://github.com/wankdanker/node-object-mapper) and [jsonpath-mapper](https://github.com/neilflatley/jsonpath-mapper) and also have these features;
- Typescript
- Map an object to another with the template by using JsonPath expression
- Merge objects and arrays with various options
- Generate array elements with various options

## Installation

```shell
$ npm install jsonpath-object-mapper
```
or
```shell
$ yarn add jsonpath-object-mapper
```

## Usage

Call `map()` function with source and schema object.

```javascript
import { map } from "jsonpath-object-mapper";

const source = {
  animals: [
    { name: "Max", species: "dog", birth: 2022 },
    { name: "Bella", species: "cat", birth: 2023 },
    { name: "Tweety", species: "bird", birth: 2024 },
  ]
};
const schema = {
  cool: {
    name: "$.animals[0].name",
  },
  cute: {
    species: "$.animals[1].species",
  },
  smart: {
    birth: "$.animals[2].birth",
  }
};

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "Max" }, cute: { species: "cat" }, smart: { birth: 2024 } }
```

### Merge Objects
Also, you can call `map()` function with an target object to merge with the mapped object.

```javascript
import { map } from "jsonpath-object-mapper";

const source = {
  animals: [
    { name: "Max", species: "dog", birth: 2022 },
    { name: "Bella", species: "cat", birth: 2023 },
    { name: "Tweety", species: "bird", birth: 2024 },
  ]
};
const schema = {
  cool: {
    name: "$.animals[0].name",
  },
};
const target = {
  cute: { species: "sheep" }
}

const result = map(source, schema, target);
console.log(result);

// Output: { cool: { name: "Max" }, cute: { species: "sheep" } }
```

## Methods
merge(source, schema[, target, options]);
Copy properties from source by following the mapping defined by schema object

- `source` (required): the object FROM which properties will be copied.
- `schema` (required): the object FROM which properties will be copied.
- `target` (optional): the object FROM which properties will be copied.
- `options` (optional): the object FROM which properties will be copied.

## Schema

The schema object define mapping structures and values.
- A schema object's `key` represents the JSON key to output to.
- A schema object's `value` represents JsonPath expression or JSON value to output.

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", birth: 2022 },
    ...
  ],
};
const schema = {
  cool: {
    name: "$.animals[0].name", // Map "Max" (which is resolved by the JsonPath) into cool.name
    species: "sheep", // Map "sheep" (which is specified as the JSON value) into cool.species
  },
}

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "Max", species: "sheep" } }
```

### Customize Output
Also, You can customize output values by specifying an special object with the following properties;
- `@path` (required): Specify JsonPath expression or JSON value to output.
- `@default` (optional): Specify JsonPath expression or JSON value used if `@path` is not resolved.
- `@converter` (optional): Specify function to convert the value of resolving `@path` or `@default`

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", birth: 2022 },
  ],
};
const schema = {
  cool: {
    name: {
      "@path": "$.plants[0].name", // Try to resolve the specified JsonPath
      "@default": "$.animals[0].name", // When not found above, try to resolve the specified JsonPath alternatively
      "@converter": (value) => { // Pass "Max" (which is resolved by the "@default") into the function
        return value + " Smith"; // Map "Max Smith" (which is returned from the "@converter") into cool.name
      }
    }
  },
}

const result = map(source, schema);
console.log(result);

// Output: { cool: { name: "Max Smith" } }
```

### Generating Array Elements
You can generate elements of an array by specifying an special object with the following properties;
- `@yield` (required): Specify 
  - A schema object's `key` represents the JSON key of an element to output to.
  - A schema object's `value` represents JsonPath expression or JSON value to output.
- `@length`: (optional): Specify a length of a generating array.
  - Can specify Number or Array (assumed as its length).
  - If omitted, the maximum value will be used.

```javascript
const source = {
  animals: [
    { name: "Max", species: "dog", birth: 2022 },
    { name: "Bella", species: "cat", birth: 2023 },
    { name: "Tweety", species: "bird", birth: 2024 },
  ],
};
const schema = {
  cool: [{ // This must be defined in an array.
    "@yield": {
      name: "$.animals.name",
      birth: "$.animals.birth",
    },
    "@length": 2
  }],
}

const result = map(source, schema);
console.log(result);

// Output:
// {
//   cool: [
//     { name: "Max", birth: 2022 },
//     { name: "Bella", birth: 2023 }
//   ]
// }
```


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