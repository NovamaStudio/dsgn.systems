// Every page under /docs/ uses the documentation layout and gets a "… — dsgn.systems docs" title.
export default {
  layout: "layouts/docs.njk",
  eleventyComputed: {
    metaTitle: (data) => `${data.title} — dsgn.systems docs`,
  },
};
