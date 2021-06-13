const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const args = process.argv;

const getThreadHtml = async (id) => {
  const url = `https://news.ycombinator.com/item?id=${id}`;
  return axios.get(url).then((r) => r.data);
};

const getComments = (html) => {
  const $ = cheerio.load(html);
  const commtexts = $(".commtext").toArray();

  const comments = commtexts.map((ct) => {
    const textObjs = ct.children.filter((c) => c.type === "text");
    return textObjs.map((to) => to.data).join(" ");
  });
  return comments;
};

const writeComments = (threadId, comments) => {
  try {
    const content = JSON.stringify(comments);
    fs.writeFileSync(
      __dirname + `/comments-${threadId}-${new Date.getTime()}.txt`,
      content,
      {
        flag: "w+",
      }
    );
  } catch (err) {
    console.error(err);
  }
};

const run = async () => {
  const threadId = args[2];

  if (!threadId) {
    console.log("Must provide a thread id");
    process.exit(2);
  }

  const html = await getThreadHtml(threadId);
  console.log(html.slice(0, 100));

  const comments = await getComments(html);

  writeComments(threadId);
};

run();
