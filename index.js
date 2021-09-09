const { default: axios } = require("axios");
const express = require("express");
const fileUpload = require("express-fileupload");
const fse = require("fs-extra");

require("dotenv").config();

const app = express();

app.use(fileUpload());

app.post("/", async (req, res) => {
  try {
    const { files } = req;
    let uploadPath = `./uploads/`;
    fse.ensureDirSync(uploadPath);
    uploadPath += `${files.file.name}`;

    await files.file.mv(uploadPath);

    const completeCSV = fse
      .readFileSync(uploadPath, { encoding: "utf-8" })
      .split("\r\n");

    let outputCSV = `Provided Name,Channel ID,Name of channel,Subscribers,Total Videos,Total Views`;
    let cerr = 0;
    let csuccess = 0;
    let isChannel = false;
    for (let index = 0; index < completeCSV.length; index++) {
      const elArr = completeCSV[index].split(",");
      let element = elArr.pop();
      isChannel = element.includes("channel");
      if (element[element.length - 1] === "/") {
        element = element.substring(0, element.length - 1);
      }
      try {
        let channelId = element.split("/").pop();

        let informationResponse;

        if (isChannel) {
          informationResponse = await axios.get(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${channelId}&key=${process.env.YT_DATA_API_KEY}`
          );
        } else {
          informationResponse = await axios.get(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&forUsername=${channelId}&key=${process.env.YT_DATA_API_KEY}`
          );
        }

        informationResponse = informationResponse.data.items[0];

        const { snippet, statistics, id } = informationResponse;

        const { title } = snippet;

        const {
          viewCount,
          subscriberCount,
          hiddenSubscriberCount,
          videoCount,
        } = statistics;

        outputCSV += `\r\n${elArr[0]},${id},${title},${
          subscriberCount || 0
        },${videoCount},${viewCount}`;
        csuccess++;
      } catch (err) {
        console.log(err.message);
        cerr++;
        console.log({ csuccess, cerr, element });
      }
    }

    const downloadPath = `./uploads/output-file.csv`;

    fse.writeFileSync(downloadPath, outputCSV);

    return res.download(downloadPath);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3014;

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
