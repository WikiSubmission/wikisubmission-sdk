# wikisubmission-sdk

An npm package to access common APIs, methods, schemas/types, and variables used across WikiSubmission, in a unified and type-safe manner.

## Installation

Using `npm`:

```
npm install wikisubmission-sdk
```

## Usage

Import the package:

```
import { WikiSubmission } from "wikisubmission-sdk";
```

Examples:

```
const ws = WikiSubmission.Quran.V1.createAPIClient();

const query = await ws.query("abraham", {
    ignore_commentary: true,
    search_case_sensitive: false
});

// Handle error
if (query instanceof WikiSubmission.Error) {
    console.log(error.name);
    console.log(error.message);
} else { 
    // Success
    console.log(query.id); // Request ID
    console.log(query.request); // Request info
    console.log(query.response); // Response data
}
```

```
// Access a method
const query = WikiSubmission.Quran.V1.Methods.parseQuery("8:9-11");

// Output:
// {
//  valid: true,
//  type: 'verse_range',
//  query: '8:9-11',
//  indices: [
//    { chapter: 8, verse: 9, verse_index: 1176 },
//    { chapter: 8, verse: 10, verse_index: 1177 },
//    { chapter: 8, verse: 11, verse_index: 1178 }
//  ],
//  metadata: { title: 'Verses 8:9-11' }
// }
```

```
// Access a schema

import z from "zod";

type QuranData = z.infer<typeof WikiSubmission.Quran.V1.Schemas.QuranData>;
```

## Todo

* Complete API coverage
* Expand package for other WikiSubmission services
* Framework specific utilities (e.g., Next.js)
* Improved query parsing

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Contact

Email: developer@wikisubmission.org

Discord: https://discord.gg/ArTXN6cwtk