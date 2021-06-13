const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
var os = require("os");

const args = process.argv;

const getThreadHtml = async (id) => {
  const url = `https://news.ycombinator.com/item?id=${id}`;
  return axios.get(url).then((r) => r.data);
};

const getComments = (html) => {
  const $ = cheerio.load(html);
  const commtexts = $(".commtext").toArray();

  const contents = commtexts.map((ct) => {
    const textObjs = ct.children.filter((c) => c.type === "text");
    return textObjs.map((to) => to.data).join(" ");
  });

  // replace the escaped links " ( )"
  const contentsCleaned = contents.map((c) => c.replace(/\s?\(\s\)/g, ""));

  const usernames = $(".comhead .hnuser")
    .toArray()
    .map((u) => u.children[0].data);

  const comments = contentsCleaned.map((content) => ({ content }));

  usernames.forEach((u, i) => (comments[i].username = u));

  const commentsNoEmpty = comments.filter((c) => !!c.content);

  return commentsNoEmpty;
};

const writeComments = (threadId, comments) => {
  try {
    const content = JSON.stringify(comments);
    fs.writeFileSync(
      __dirname + `/comments-${threadId}-${new Date().getTime()}.txt`,
      content,
      {
        flag: "w+",
      }
    );
  } catch (err) {
    console.error(err);
  }
};

const mapToSymbl = (comments) => {
  const messages = comments.map((c) => ({
    payload: {
      content: c.content,
    },
    from: {
      userId: c.username,
      name: c.username,
    },
  }));

  return { messages, enableSummary: true, detectPhrases: true };
};

const run = async () => {
  const threadId = args[2];

  if (!threadId) {
    console.error("Must provide a thread id");
    process.exit(2);
  }

  console.log(`Fetching thread ${threadId}...`);
  const html = await getThreadHtml(threadId);

  console.log(`Extracting comments...`);
  const comments = await getComments(html);

  console.log(comments.slice(0, 3));

  console.log(`Writing comments to file...`);

  const symblReq = mapToSymbl(comments);

  writeComments(threadId, symblReq);
  console.log("done.");
};

run();
