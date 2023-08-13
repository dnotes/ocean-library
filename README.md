# Ocean AI Testing Playground

This web application has been created to test AI-assisted semantic search of
some core Ocean content.

Please visit [https://oceanlibrary.com](https://oceanlibrary.com) for the
free, fully-featured version 2 of Ocean Library.

[![Ocean 2.0, an amazing app for reading or listening to the religious texts of the world.](/images/Ocean2.png)](https://oceanlibrary.com)

## Roadmap

* [ ] Add the ability to filter searches by category or author.

* [x] Add AI search text preprocessor

  When a person types in search text, they might include language that would
  confuse a semantic search and produce bad results. An AI preprocessor might
  be able to cut out the noise before the search is made.

* [x] Add AI search result preprocessor

  The semantic search returns very small snippets of text, about the length of
  a short sentence. An AI might be able to pick the best passages for further
  study from a list of those texts.

* [ ] Add AI search processor

  Once we have the search results that we really want, we can experiment with
  what we want the AI to do with them. Here are some ideas:

  * summarize the results, with quotes as appropriate
  * organize the results into categories, making an ad-hoc compilation

