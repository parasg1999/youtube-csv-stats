const { default: axios } = require("axios");
const express = require("express");
const fileUpload = require("express-fileupload");
const fse = require("fs-extra");

const app = express();

app.use(fileUpload());

app.post("/", async (req, res) => {
  try {
    const { files } = req;
    let uploadPath = `./uploads/`;
    fse.ensureDirSync(uploadPath);
    uploadPath += `${files.file.name}`;

    await files.file.mv(uploadPath);

    // const completeCSV = fse
    //   .readFileSync(uploadPath, { encoding: "utf-8" })
    //   .split("\r\n");

    const completeCSV = [
      "wow",
      "https://www.youtube.com/channel/UCpdsmUIkLpfopjURSYF1gaA",
    ];

    let outputCSV = `ID,Name,Subscribers,Total Videos,Total Views,Picture`;

    for (let index = 1; index < completeCSV.length; index++) {
      let element = completeCSV[index];
      if (element[element.length - 1] === "/") {
        element = element.substring(0, element.length - 1);
      }

      const channelId = element.split("/").pop();
      const subscriberResponse = await axios.get(
        `https://counts.live/api/youtube-subscriber-count/${channelId}/live`
      );

      const informationResponse = await axios.get(
        `https://counts.live/api/youtube-subscriber-count/${channelId}/search`
      );

      const { subscribers, videos, views } = subscriberResponse.data.data;
      const { name, picture, backdrop, id } = informationResponse.data.data[0];

      outputCSV += `\r\n${id},${name},${subscribers},${videos},${views},${picture}`;
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
